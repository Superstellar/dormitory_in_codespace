package com.DormitoryBack.domain.member.domain.service;

import com.DormitoryBack.domain.group.domain.service.GroupService;
import com.DormitoryBack.domain.jwt.TokenProvider;
import com.DormitoryBack.module.crypt.EmailEncryptor;
import com.DormitoryBack.module.crypt.PasswordEncryptor;
import com.DormitoryBack.domain.member.domain.dto.UserLogInDTO;
import com.DormitoryBack.domain.member.domain.dto.UserRequestDTO;
import com.DormitoryBack.domain.member.domain.dto.UserResponseDTO;
import com.DormitoryBack.domain.member.domain.entity.RoleType;
import com.DormitoryBack.domain.member.domain.entity.User;
import com.DormitoryBack.domain.member.domain.repository.UserRepository;
import com.DormitoryBack.domain.member.restriction.domain.enums.Function;
import com.DormitoryBack.domain.member.restriction.domain.service.RestrictionService;

import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
//Spring Security
import org.springframework.stereotype.Service;

import java.util.Iterator;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    @Autowired
    private final EmailEncryptor emailEncryptor;

    @Autowired
    private final PasswordEncryptor passwordEncryptor;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TokenProvider tokenProvider;

    @Autowired
    private GroupService groupService;

    @Autowired
    private RestrictionService restrictionService;

    public List<UserResponseDTO> getAllUsers(){
        List<User> users=userRepository.findAll();
        if(users.isEmpty()){
            throw new RuntimeException("사용자가 존재하지 않습니다.");
        }
        List<UserResponseDTO> responseDTO = users.stream()
                .map(user -> new UserResponseDTO(user.getId(),emailEncryptor.decryptEmail(user.getEMail()), user.getNickName(),user.getDormId()))
                .collect(Collectors.toList());

        return responseDTO;
    }

    public UserResponseDTO getUser(Long usrId){
        User user=userRepository.findById(usrId).orElse(null);
        if(user==null){
            throw new IllegalArgumentException("해당 아이디에 대한 사용자가 존재하지 않습니다.");
        }
        UserResponseDTO responseDTO=UserResponseDTO.builder()
                .id(usrId)
                .eMail(emailEncryptor.decryptEmail(user.getEMail()))
                .nickName(user.getNickName())
                .dormId(user.getDormId())
                .build();

        return responseDTO;
    }

    public UserResponseDTO getUserByNickName(String nickName) {
        User user=userRepository.findByNickName(nickName);
        if(user==null){
            throw new RuntimeException("UserNotFound");
        }
        UserResponseDTO responseDTO=UserResponseDTO.builder()
                .eMail(emailEncryptor.decryptEmail(user.getEMail()))
                .nickName(nickName)
                .dormId(user.getDormId())
                .build();

        return responseDTO;
    }

    public String getUserNickName(String token) {
        if(!tokenProvider.validateToken(token)){
            throw new JwtException("유효하지 않은 토큰입니다.");
        }
        Long userId= tokenProvider.getUserIdFromToken(token);
        User user=userRepository.findById(userId).orElse(null);
        return user.getNickName();
    }


    public UserResponseDTO updateUser(Long usrId, UserRequestDTO dto){
        User user=userRepository.findById(usrId).orElse(null);
        if(user==null){
            throw new IllegalArgumentException("해당 아이디에 대한 사용자가 존재하지 않습니다.");
        }
        String confirm=dto.getConfirmPassword();
        if(confirm==null){
            throw new RuntimeException("ConfirmPasswordNotCorrect");
        }
        if(!passwordEncryptor.matchesPassword(confirm, user.getPassWord())){
            throw new RuntimeException("ConfirmPasswordNotCorrect");
        }
        user.update(dto);
        if(dto.getMail()!=null){
            String encryptedEmail=emailEncryptor.encryptEmail(dto.getMail());
            user.setEMail(encryptedEmail);
        }
        if(dto.getPassWord()!=null){
            String encryptedPassword=passwordEncryptor.encryptPassword(dto.getPassWord());
            user.setPassWord(encryptedPassword);
        }
        User saved=userRepository.save(user);

        UserResponseDTO responseDTO=UserResponseDTO.builder()
                .eMail(emailEncryptor.decryptEmail(saved.getEMail()))
                .nickName(saved.getNickName())
                .dormId(user.getDormId())
                .build();

        return responseDTO;

    }

    public UserResponseDTO makeNewUser(UserRequestDTO dto) {
        User existingUserMail = this.findUserByeMail(dto.getMail());
        User existingUserNick = userRepository.findByNickName(dto.getNickName());
        
        if (existingUserMail != null) {
            throw new IllegalArgumentException("이미 사용중인 메일입니다.");
            //throw new IllegalArgumentException("DuplicatedMail"); <- 이 코드로 변경 필요 
        }

        if(existingUserNick != null){
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다.");
            //throw new IllegalArgumentException("DuplicatedNickname"); <- 이 코드로 변경 필요 
        }
        String encryptedPassword=passwordEncryptor.encryptPassword(dto.getPassWord());
        String encryptedEmail=emailEncryptor.encryptEmail(dto.getMail());
        
        User user = User.builder()
                .eMail(encryptedEmail) 
                .passWord(encryptedPassword) 
                .nickName(dto.getNickName())
                .dormId(dto.getDormId())
                .provider(dto.getProvier())
                .role(RoleType.ROLE_USER)
                .build();  

        User saved=userRepository.save(user);

        UserResponseDTO responseDTO=UserResponseDTO.builder()
                .eMail(emailEncryptor.decryptEmail(saved.getEMail()))
                .nickName(saved.getNickName())
                .dormId(saved.getDormId())
                .build();

        return responseDTO;
    }

    public String logIn(UserLogInDTO dto){
        String email=dto.getEMail();
        User user=this.findUserByeMail(email);
        if(user==null){
            throw new RuntimeException("해당 이메일을 가진 사용자가 존재하지 않습니다."); // IllegalArgumentException -> Run
        }
        else if(!passwordEncryptor.matchesPassword(dto.getPassWord(), user.getPassWord())){
            throw new RuntimeException("비밀번호가 일치하지 않습니다.");
        }
        Object result=restrictionService.getIsRestricted(Function.LOGIN, user.getId());
        if(result instanceof String){ //String 반환 시 이미 isRestricted는 true
            String message=(String)result;
            throw new RuntimeException(message);
        }

        //result가 String 타입이 아닐 시 Boolean 타입이며 값은 false임. 즉 제제가 없다는 의미이므로 로그인에 문제가 없음.
        return tokenProvider.createToken(user);
    }

    public void deleteUser(Long usrId, UserRequestDTO dto){
        User target=userRepository.findById(usrId).orElse(null);
        if(target==null){
            throw new IllegalArgumentException("존재하지 않는 유저입니다.");
        }
        else if(!passwordEncryptor.matchesPassword(dto.getConfirmPassword(), target.getPassWord())){
            throw new RuntimeException("ConfirmPasswordNotCorrect");
        }
        else if(groupService.isBelongToAnywhere(usrId)){
            throw new RuntimeException("CannotDeleteUserWhileGrouping");
        }
        userRepository.delete(target);
    }

    private User findUserByeMail(String eMail){
        List<User> userList=userRepository.findAll();
        Iterator<User> iterator=userList.iterator();
        while(iterator.hasNext()){
            User user=iterator.next();
            if((emailEncryptor.decryptEmail(user.getEMail())).equals(eMail)){
                return user;
            }
        }
        return null;
    }
    
}

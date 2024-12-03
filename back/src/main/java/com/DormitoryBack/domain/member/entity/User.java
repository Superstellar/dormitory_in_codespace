package com.DormitoryBack.domain.member.entity;
import com.DormitoryBack.domain.article.domain.entity.Article;
import com.DormitoryBack.domain.member.dto.UserRequestDTO;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.persistence.*;
import lombok.*;
import lombok.extern.slf4j.Slf4j;

import java.util.List;


@Slf4j
@Data
@Builder
@AllArgsConstructor
@Entity
@NoArgsConstructor
@Getter
@Table(name="user")
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique = true)
    private String eMail;

    @Column(nullable = false)
    @JsonIgnore
    private String passWord;

    @Column
    private String nickName;

    @Column
    private Long dormId;

    @JsonIgnore
    @OneToMany(mappedBy = "usrId")
    private List<Article> articles;
    //DB에 반영되지 않음.

    public void update(UserRequestDTO dto){
        if(dto.getMail()!=null){this.eMail=dto.getMail();}  //사실상 필요 없는 코드 
        if(dto.getPassWord()!=null){this.passWord=dto.getPassWord();} //사실상 필요 없는 코드  
        if(dto.getNickName()!=null){this.nickName=dto.getNickName();} 
        if(dto.getDormId()!=null){this.dormId=dto.getDormId();}
    }



    public String toJsonString(){
        ObjectMapper objectMapper=new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());

        String jsonString="";
        try{
            jsonString=objectMapper.writeValueAsString(this);
        }catch(JsonProcessingException e){
            e.printStackTrace();
        }
        return jsonString;
    }

}

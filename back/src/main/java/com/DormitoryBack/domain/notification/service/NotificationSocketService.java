package com.DormitoryBack.domain.notification.service;

import com.DormitoryBack.domain.article.domain.repository.ArticleRepository;
import com.DormitoryBack.domain.group.domain.repository.GroupRepository;
import com.DormitoryBack.domain.member.repository.UserRepository;
import com.DormitoryBack.domain.notification.module.NotificationSocketManager;
import com.corundumstudio.socketio.SocketIOClient;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.SetOperations;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Iterator;
import java.util.Set;

@RequiredArgsConstructor
@Service
public class NotificationSocketService {
    private final NotificationSocketManager socketManager;
    private final ObjectMapper objectMapper=new ObjectMapper();
    private final UserRepository userRepository;

    private final RedisTemplate<String,Long> redisTemplate;

    public void sendNotification(String message){
        //subjectType이 group인 경우 member 모두에게 알림 전송
        String subjectType;
        Long subjectUserId;
        Long triggerUserId;

        try{
            JsonNode messageNode=objectMapper.readTree(message);
            subjectType=messageNode.get("subject").get("entityType").asText();
            subjectUserId=getUserIdFromEntity(messageNode.get("subject"));
            triggerUserId=getUserIdFromEntity(messageNode.get("trigger"));

        }catch(JsonProcessingException e){
            throw new RuntimeException(e.getMessage());
        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }
        if(subjectType=="GROUP"){
            String groupId;
            try{
                JsonNode messageNode=objectMapper.readTree(message);
                groupId=messageNode.get("subject").get("stringifiedEntity").get("id").asText();

            }catch(JsonProcessingException e){
                throw new RuntimeException(e.getMessage());
            }catch(Exception e){
                throw new RuntimeException(e.getMessage());
            }
            SetOperations<String,Long> setOperations=redisTemplate.opsForSet();
            Set<Long> membersId=setOperations.members(groupId);
            Iterator<Long> iterator=membersId.iterator();
            while(iterator.hasNext()){
                Long memberId=iterator.next();
                SocketIOClient targetSocketClient=socketManager.getSocketClientByUserId(memberId);
                targetSocketClient.sendEvent("notification",message);
            }
        }
        else{
            if(subjectUserId==triggerUserId){
                return ;
            }
            SocketIOClient targetSocketClient=socketManager.getSocketClientByUserId(subjectUserId);
            targetSocketClient.sendEvent("notification",message);

        }
    }

    private Long getUserIdFromEntity(JsonNode entityNode){
        String entityType=entityNode.get("entityType").asText();
        JsonNode entity=entityNode.get("stringifiedEntity");
        Long userId;
        switch (entityType){
            case "ARTICLE":
                userId=entity.get("userId").asLong();
                break;
            case "COMMENT":
                userId=entity.get("user").get("id").asLong();
                break;
            case "GROUP":
                userId=entity.get("hostId").asLong();
                break;
            case "USER":
                userId=entity.get("id").asLong();
                break;
            case "MESSAGE":
                String userName=entity.get("username").asText();
                userId=userRepository.findByNickName(userName).getId();
                break;
            default:
                userId=null;
                break;
        }
        if(userId==null){
            throw new RuntimeException("WrongEntity");
        }
        return userId;

    }

    /*
    public void verifyAndSendNotification(String message){
        String subjectType;
        String triggerType;
        try{
            JsonNode messageNode=objectMapper.readTree(message);
            subjectType=messageNode.get("subject").get("entityType").asText();
            triggerType=messageNode.get("trigger").get("entityType").asText();

        }catch(JsonProcessingException e){
            throw new RuntimeException(e.getMessage());
        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }
        Boolean isValid=verifyNotification(message,subjectType,triggerType);
        if(!isValid){
            return ;
        }
        //sendNotification(message);
    }






    private Boolean verifyNotification(String message,String sbjType, String trgType){
        try{
            JsonNode messageNode=objectMapper.readTree(message);
        }catch(JsonProcessingException e){
            throw new RuntimeException(e.getMessage());
        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }

        if(sbjType=="ARTICLE" && trgType=="COMMENT"){

        }
        else if(sbjType=="COMMENT" && trgType=="COMMENT"){

        }
        else if(sbjType=="GROUP" && trgType=="GROUP"){

        }
        else if(sbjType=="GROUP" && trgType=="USER"){

        }
        else if(sbjType=="GROUP" && trgType=="MESSAGE"){

        }
        return true;
    }

     */


    /*
    private HashMap<String,Long> getIdsOfTargets(String message){
        HashMap<String,Long> IdsOfTargets=new HashMap<>();
        try{
            JsonNode messageNode=objectMapper.readTree(message);
            JsonNode subject=messageNode.get("subject");
            JsonNode trigger=messageNode.get("trigger");
            Long subjectUserId=getUserIdFromEntity(subject);
            Long triggerUserId=getUserIdFromEntity(trigger);
            IdsOfTargets.put("subject",subjectUserId);
            IdsOfTargets.put("trigger",triggerUserId);

        }catch(JsonProcessingException e){
            throw new RuntimeException(e.getMessage());
        }catch(Exception e){
            throw new RuntimeException(e.getMessage());
        }
        return IdsOfTargets;
    }
     */



}

package com.DormitoryBack.domain.file.domain.service;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.fail;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.MalformedURLException;
import java.net.URL;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import com.DormitoryBack.domain.jwt.TokenProvider;
import com.DormitoryBack.domain.member.domain.service.UserServiceExternal;
import com.amazonaws.services.s3.AmazonS3;
import com.amazonaws.services.s3.model.GeneratePresignedUrlRequest;
import com.amazonaws.services.s3.model.ObjectMetadata;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@ExtendWith(MockitoExtension.class)
public class FileServiceTest {

    @InjectMocks
    @Spy
    private FileService fileService;
    
    @Mock
    private AmazonS3 s3Client;

    @Mock
    private MultipartFile file;

    @Mock
    private TokenProvider tokenProvider;

    @Mock
    private UserServiceExternal userService;

    private String bucketName="bucketName";

    @BeforeEach
    public void setUp(){
        MockitoAnnotations.openMocks(this);
        fileService.setBucketName(bucketName);
    }

    @Test
    public void testUploadFile() throws IOException {
        String originalFileName="test.txt";
        byte[] content="test content".getBytes();

        when(file.getOriginalFilename()).thenReturn(originalFileName);
        when(file.getInputStream()).thenReturn(new ByteArrayInputStream(content));
        when(file.getContentType()).thenReturn("text/plain");
        when(file.getSize()).thenReturn((long) content.length);

        when(s3Client.putObject(anyString(), anyString(), any(InputStream.class), any(ObjectMetadata.class))).thenReturn(null);
        String result=fileService.uploadFile(file);

        assertNotNull(result);
        assertTrue(result.endsWith(originalFileName));
        verify(s3Client, times(1)).putObject(anyString(), anyString(), any(), any(ObjectMetadata.class)); 
    }


    @Test
    public void testUploadFile_IOException() throws IOException{

        String originalFileName="test.txt";
        when(file.getOriginalFilename()).thenReturn(originalFileName);
        when(file.getInputStream()).thenThrow(new IOException());

        assertThrows(IOException.class, ()->fileService.uploadFile(file));
    }

    @Test
    public void testGetObjectMetadata(){
        when(file.getContentType()).thenReturn("text/plain");
        when(file.getSize()).thenReturn(123L);

        ObjectMetadata metadata=fileService.getObjectMetadata(file);

        assertEquals("text/plain", metadata.getContentType());
        assertEquals(123L, metadata.getContentLength());
    }

    @Test
    public void testGenerateFileName(){
        String originalFileName="test.txt";
        when(file.getOriginalFilename()).thenReturn(originalFileName);

        String fileName=fileService.generateFileName(file);

        assertTrue(fileName.contains(originalFileName));
    }

    @Test
    public void testGeneratePresignedURL(){
        String fileName="test.txt";
        String expectedUrl="https://delivery-box.s3.ap-northeast-2.amazonaws.com/test.txt?~~~~";
        String validToken="validToken";
        Long userId=1L;
        
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserIdFromToken(validToken)).thenReturn(userId);
        when(userService.getUserImageName(userId)).thenReturn(fileName);

        try{
            URL url=new URL(expectedUrl);
            when(s3Client.generatePresignedUrl(any(GeneratePresignedUrlRequest.class))).thenReturn(url);
        }catch(MalformedURLException e){
            fail("MalformedURLException :"+e.getMessage());
        }finally{
            String result=fileService.generatePresignedURL(validToken);

            assertNotNull(result);
            assertTrue(result.startsWith("https://delivery-box.s3.ap-northeast-2.amazonaws.com/test.txt?"));
            assertTrue(result.contains(fileName));
        }
    }

    @Test
    public void testGeneratePresignedURL_InvalidToken(){

        String invalidToken="invalidToken";
        
        when(tokenProvider.validateToken(invalidToken)).thenReturn(false);

        RuntimeException exception=assertThrows(RuntimeException.class, ()->{
            fileService.generatePresignedURL(invalidToken);
        });

        assertEquals("InvalidToken", exception.getMessage());
    }

    @Test
    public void testGeneratePresignedURL_NoUserImage(){
        String validToken="validToken";
        Long userId=1L;
        
        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserIdFromToken(validToken)).thenReturn(userId);
        when(userService.getUserImageName(userId)).thenReturn(null);

        RuntimeException exception=assertThrows(RuntimeException.class, ()->{
            fileService.generatePresignedURL(validToken);
        });

        assertEquals("NoUserImage", exception.getMessage());
    }

    @Test
    public void testDeleteFile(){
        String fileName="test.txt";
        doNothing().when(s3Client).deleteObject(anyString(),anyString());

        fileService.deleteFile(fileName);
        
        verify(s3Client, times(1)).deleteObject(anyString(),anyString());

    }

    @Test
    public void testSetUserProfileImage_withoutDelete(){
        String validToken="validToken";
        Long userId=1L;
        String imageName="image.png";

        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserIdFromToken(validToken)).thenReturn(userId);
        when(userService.getUserImageName(userId)).thenReturn(null);

        assertDoesNotThrow(()->{
            fileService.setUserProfileImage(file,validToken);
        });
        verify(tokenProvider,times(1)).getUserIdFromToken(validToken);
        verify(userService,times(1)).getUserImageName(userId);
        try{
            verify(fileService,times(0)).deleteFile(imageName);
            verify(fileService,times(1)).uploadFile(file);
        }catch(IOException e){
            fail();
        }
    }

    @Test
    public void testSetUserProfileImage_withDelete(){
        String validToken="validToken";
        Long userId=1L;
        String imageName="image.png";

        when(tokenProvider.validateToken(validToken)).thenReturn(true);
        when(tokenProvider.getUserIdFromToken(validToken)).thenReturn(userId);
        when(userService.getUserImageName(userId)).thenReturn(imageName);

        assertDoesNotThrow(()->{
            fileService.setUserProfileImage(file,validToken);
        });
        verify(tokenProvider,times(2)).getUserIdFromToken(validToken);
        verify(userService,times(1)).getUserImageName(userId);
        try{
            verify(fileService,times(1)).deleteUserProfileImage(validToken);
            verify(fileService,times(1)).uploadFile(file);
        }catch(IOException e){
            fail();
        }
    }

    @Test
    public void testSetUserProfileImage_InvalidToken(){
        String invalidToken="invalidToken";
        
        when(tokenProvider.validateToken(invalidToken)).thenReturn(false);

        RuntimeException exception=assertThrows(RuntimeException.class, ()->{
            fileService.setUserProfileImage(file, invalidToken);
        });

        assertEquals("InvalidToken", exception.getMessage());
    }





}

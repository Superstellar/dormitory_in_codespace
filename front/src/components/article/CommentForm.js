import React, { useState,useRef,useContext} from 'react';
import { IconButton, TextField } from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import axios from 'axios';
import {toast} from 'react-toastify';
import Swal from 'sweetalert2';
import HomeSelectContext from '../home/HomeSelectContext';

function CommentForm({y,rootCommentId,placeHolder,setPlaceHolder,inputRef,article_Id,isReply,setIsReply}) {
  const [comment, setComment] = useState('');
  const token=localStorage.getItem('token');
  const formRef=useRef(null);
  const {selectComponentIndex,setSelectComponentIndex}=useContext(HomeSelectContext);

  const sendReply = async () => {
    if(comment===""){
      toast.warn("내용을 입력해주세요!");
      inputRef.current.focus();
    }
    else{
      const path = `https://improved-space-tribble-vjvwrwx956jh69w4-8080.app.github.dev/api/v1/comment/newReply`;
      const data={
        rootCommentId:rootCommentId,
        content:comment,
      };
      try{
        const response= await axios.post(path,data,{
          headers:{
            'Authorization':`${token}`,
          }
          
        });
      localStorage.setItem("index",5);
      window.location.reload();
      setSelectComponentIndex(5);

      }catch(error){
        console.error(error);
        if(error.response.data==="유효하지 않은 토큰입니다."){
          localStorage.setItem("nextIndex",5);
          setSelectComponentIndex(8);
          toast.error("회원 정보가 유요하지 않아요! 로그인해주세요.");
      }
      }
      setIsReply(0);
      setPlaceHolder("댓글을 입력하세요");
      setComment("");
    }

  }

  const sendComment = async () => {

    if(comment==''){
      toast.warn("내용을 입력해주세요!");
      return 
    }
    const fullPath = `https://improved-space-tribble-vjvwrwx956jh69w4-8080.app.github.dev/api/v1/comment/new`;
    const data = {
      articleId:article_Id,
      content:comment,
    };
  
    try {
    const response = await axios.post(fullPath, data, {
        headers: {
        'Authorization':`${token}`,
        }
    });
    localStorage.setItem("index",5);
    window.location.reload();
    } catch (error) {
        if(error.response.data==="유효하지 않은 토큰입니다."){
            localStorage.setItem("nextIndex",5);
            setSelectComponentIndex(8);
            toast.error("회원 정보가 유요하지 않아요! 로그인해주세요.");
        }
    }
}

const handleBlur = () => {
  const rect=formRef.current.getBoundingClientRect();
  if(!(y+10<rect.top)){
    return 
  }

  if(placeHolder==="대댓글을 입력하세요."){
    if(comment!=""){
      Swal.fire({
        confirmButtonColor:"#FF8C00",
        icon:"question",
        text: "대댓글을 작성을 종료하시겠어요?",
        confirmButtonText:"예",
        cancelButtonText:"아니오",
        showCancelButton: true
      }).then((result)=>{
          if(result.isConfirmed){
              setPlaceHolder("댓글을 입력하세요.");
              setComment("");
              setIsReply(0);
              return 
          }
          else{
            inputRef.current.focus();
          }
      });
    }
    else{
      setIsReply(0);
      setPlaceHolder("댓글을 입력하세요.");
    }
  }
}

  return (
    <div className='App'>
      <div className="comment-submit" ref={formRef} >
        <input
          ref={inputRef}
          type='text'
          className="form-control"
          placeholder={placeHolder}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          onBlur={handleBlur}
        />
        <IconButton
          onClick={() => {
            if(!isReply){
              sendComment();
            }
            else{
              sendReply();
            }
            }}>
          <SendIcon/>
        </IconButton>
      </div>
    </div>

  );
}

export default CommentForm;

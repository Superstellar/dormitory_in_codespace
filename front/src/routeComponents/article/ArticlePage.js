import {React,useState,useEffect,useContext,useRef} from 'react';
import axios from 'axios';
import BackButton from '../../components/article/BackButton';
import ThreeDotsMenu from '../../components/article/ThreeDotsMenu';
import userDefault from '../../images/userDefault.png';
import 'react-toastify/dist/ReactToastify.css';
import CommentForm from '../../components/article/CommentForm';
import CommentMenu from '../../components/article/CommentMenu';
import HomeSelectContext from '../../components/home/HomeSelectContext';
import ParticipateButton from '../../components/article/ParticipateButton';
import GroupStartButton from '../../components/article/GroupStartButton';
import { getRelativeTime } from '../../modules/common/timeModule';
import ArticleContext from '../../components/article/ArticleContext';
import ProfileImageContext from '../../components/common/ProfileImageContext';
import { getProfileImages } from '../../modules/common/profileImageModule';

function ArticlePage(){
    const[commentList,setCommentList]=useState([]);
    const[isWriter,setIsWriter]=useState(1);
    const[isReply,setIsReply]=useState(0);
    const[formPlaceHolder,setFormPlaceHolder]=useState("댓글을 입력하세요.");
    const[commentId,setCommentId]=useState(-1);
    const[touchY,setTouchY]=useState(-1);
    const [commentsAltered,setCommentsAltered]=useState(0);
    const {selectComponentIndex,setSelectComponentIndex}=useContext(HomeSelectContext);
    const {article,setArticle}=useContext(ArticleContext);
    const token=localStorage.getItem('token');
    const {profileImages, setProfileImages} = useContext(ProfileImageContext);    
    const inputRef=useRef();
    const commentListRef=useRef(null);

    const pageInit = () =>{
      setCommentList([]);
      setFormPlaceHolder("댓글을 입력하세요");
      setIsReply(0);
      setCommentId(-1);
      setTouchY(-1);
      const prevPage=(localStorage.getItem("nextIndex"));
      if(prevPage==null){
        setSelectComponentIndex(0);
      }
      else{
        setSelectComponentIndex(parseInt(prevPage));
        localStorage.removeItem("nextIndex");
      }
      setArticle({}); //주의!
    }

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      setTouchY(touch.clientY);
    }

    const getComments = async () => {
      const path = `${process.env.REACT_APP_HTTP_API_URL}/comment/article/${article.id}`;
      const headers={"Authorization":`${token}`};
      try {
          const response = await axios.get(path,{headers});
          const rootCommentList = response.data.rootComments.map(item => JSON.parse(item));
          const replyCommentList = response.data.replyComments.map(item => JSON.parse(item));
          const combinedComments = rootCommentList.map(rootComment => {
              const repliesToRoot = replyCommentList.filter(reply => reply.rootCommentId === rootComment.id);
              return { ...rootComment, replyComments: repliesToRoot };
          });
          setCommentList(combinedComments);
      } catch (error) {
          console.error(error);
      }
    };
  
    const isSame = async (token) => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_HTTP_API_URL}/token/userId`, {
            headers: {
                'Authorization': `${token}`
            }
        });
        if(response.data===article.user.id){
          return 1;
        }
        else{
          return 0;
        }
      } catch (error) {
          console.error('An error occurred isSame in ArticlePage.js:', error);
          return 0;
      }
    }

    const convertDorIdToString = (num) => {
      const mappingDict = {
        1: '오름1',
        2: '오름2',
        3: '오름3',
        4: '푸름1',
        5: '푸름2',
        6: '푸름3',
        7: '푸름4',
        8: '기숙사 상관없음'
      };
      return mappingDict[num] || "Invalid input";
    }

    useEffect(()=>{
      if(selectComponentIndex!==5){
        return ;
      }
      isSame(token).then(result=>setIsWriter(result));
    },[selectComponentIndex]);

    useEffect(()=>{
      if(selectComponentIndex!==5){
        return ;
      }
      if(commentsAltered===1){
        return ;
      }
      async function fetchData(){
        await getComments();
      }
      fetchData();
    },[selectComponentIndex])

    useEffect(()=>{
      async function fetchData(){
        await getComments();
      }
      if(commentsAltered===0){
        return ;
      }
      if(commentsAltered===1){
        fetchData();
      }
      setCommentsAltered(0);
    },[commentsAltered])

    if(selectComponentIndex!==5){
      return null;
    }

    const profileImageById = (id) => {
      getProfileImages("USERID", id, profileImages, setProfileImages);
      return profileImages["USERID"][id] || userDefault;
    }

    function renderComment (comment, index) {
      return (
        <div key={index} className="comment-item">
          <div className="comment-item-header">
            <div className="comment-profile-nickname">
              <img className='rounded-image' src={profileImageById(comment.user?.id)} />
              {comment.user.encryptedEmail!=="-" ? comment.user.nickName : "알 수 없음"}
            </div>
            <CommentMenu
              rootCommentId={comment.id}
              setRootCommentId={setCommentId}
              setPlaceHolder={setFormPlaceHolder}
              inputRef={inputRef}
              isReply={isReply}
              setIsReply={setIsReply}
              writerId={comment.user.encryptedEmail!=="-" ? comment.user.id : 0}
              commentParam={comment}
              setCommentsAltered={setCommentsAltered}
            />
          </div>
          <p className="comment-item-content">{comment.content}</p>
          <p className="comment-item-time">{getRelativeTime(comment.createdTime)}</p>
          {comment.replyComments && comment.replyComments.map(renderReply)}
        </div>
      )
    };

    function renderReply (reply, index) {
      return (
        <div key={index} className="comment-item reply">
          <div className="comment-item-header">
            <div className="comment-profile-nickname">
              <img className='rounded-image' src={profileImageById(reply.user?.id)} />
              {reply.user.encryptedEmail!=="-" ? reply.user.nickName : "알 수 없음"}
            </div>
            <CommentMenu
              isForReply={1}
              writerId={reply.user.encryptedEmail!=="-" ? reply.user.id : 0}
              commentParam={reply}
              setCommentsAltered={setCommentsAltered}
            />
          </div>
          <p className="comment-item-content">{reply.content}</p>
          <p className="comment-item-time">{getRelativeTime(reply.createdTime)}</p>
        </div>
      )
    };


    return (
        <div className="App"
              onTouchStart={handleTouchStart}
              style={{ height: '100vh', width: '100vw' }}>

            <div className="app-article-header">
                <BackButton pageInit={pageInit}></BackButton>
                <ThreeDotsMenu isWriterParam={isWriter} articleParam={article}></ThreeDotsMenu>
                
            </div>
            <div className="app-article-main">
              <div className="article-info">
                <img src={profileImageById(article.user?.id)} alt="description" className='rounded-image'/>
                  <div className="article-info-detail">
                    <p>{article.user.nickName || "알 수 없음"}</p>
                    <p>{getRelativeTime(article.createdTime)}</p>
                  </div>
                <div className='article-info-right'>
                  {isWriter === 1 ? <GroupStartButton articleId={article.id}/> : <ParticipateButton articleId={article.id}/>}
                </div>
              </div>
              
              <div className='article-body'>
              <p className='article-title'>{article.title}</p>
                <div className="article-meta">
                  <p className="article-category">{article.category}</p>
                  <p className="article-dormitory">{convertDorIdToString(article.dormId)}</p>
                </div>

                <div>
                  <div className='article-content'> 
                    {article.contentHTML}
                  </div>
                  <div className="comment-list" >
                  {commentList && commentList.map(renderComment)}
                  </div>
                  </div>
              </div>
            </div>
      
            <div className="app-article-footer">
              <CommentForm
                y={touchY}
                rootCommentId={commentId}
                setPlaceHolder={setFormPlaceHolder}
                placeHolder={formPlaceHolder}
                inputRef={inputRef}
                article_Id={article.id}
                isReply={isReply} 
                setIsReply={setIsReply}
                setCommentsAltered={setCommentsAltered}>
              </CommentForm>
            </div>
        </div>
    );
}



export default ArticlePage;
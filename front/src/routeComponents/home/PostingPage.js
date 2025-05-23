import React, { useState,useContext,useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.css'; 
import HomeSelectContext from '../../components/home/HomeSelectContext';
import axios from 'axios';
import BackButton from '../../components/home/BackButton';
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

function PostingPage() {
    const[pageTitle,setPageTitle]=useState("글 쓰기");
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [dorSelect, setDorSelect] = useState("기숙사");
    const [cateSelect, setCateSelect]=useState("카테고리");

    const [targetId,setTargetId]=useState(0);
    //수정해야할 article의 id를 나타냄, targetId가 0이라는 것은 patch mode가 아니라 posting mode임을 의미함
    //useEffecf에 toBePatchedArticleId가 존재한다면 그 값을 targetId에 저장하고 해당 변수를 localStorage에서 즉시 삭제
    
    const [limitedPatch,setLimitedPatch]=useState(0);
    const [article,setArticle]=useState({});
    const [buttonText,setButtonText]=useState("다음"); 
    const token=localStorage.getItem('token');
    const {selectComponentIndex,setSelectComponentIndex}=useContext(HomeSelectContext);

    useEffect(()=>{
      const id=localStorage.getItem("toBePatchgedArticleId");
      if(selectComponentIndex!=5){
        setTitle("");
        setContent("");
        setTargetId(0);
        setPageTitle("글 쓰기");
      }
      if(id===null){
        return ;
      }
      setPageTitle("글 수정하기");
      setTargetId(parseInt(id));
      localStorage.removeItem("toBePatchgedArticleId");
      if(localStorage.getItem("limitedPatch")==1){
        setLimitedPatch(1);
        localStorage.removeItem("limitedPatch");
      }
        
    },[selectComponentIndex])

    useEffect(()=>{
      if(targetId==0){
        return ;
      }
      if(limitedPatch==1){
        setButtonText("수정");
      }
      setArticleState();
    },[targetId])


    useEffect(()=>{
      if(cateSelect==="카테고리" || dorSelect==="기숙사"){
        return ;
      }
      postArticle();
    },[cateSelect]);


    const setArticleState = async () => {
      const path=`${process.env.REACT_APP_HTTP_API_URL}/article/${targetId}`
      try{
        const response=await axios.get(path);
        setTitle(response.data.title);
        setContent(response.data.contentHTML);
        setArticle(response.data);

      }catch(error){
        console.error(error);
        toast.error("예상하지 못한 문제가 발생했어요.");
      }
      
    }
      
      const handleSwalDorm= async () => {
        const { value } = await Swal.fire({
          confirmButtonColor:"#FF8C00",
          title: "기숙사",
          confirmButtonText:"선택",
          cancelButtonText:"취소",
          input: "select",
          inputOptions: {
            1:"오름1",
            2:"오름2",
            3:"오름3",
            4:"푸름1",
            5:"푸름2",
            6:"푸름3",
            7:"푸름4",
            8:"상관없음"
          },
          inputPlaceholder: "기숙사를 선택해요.",
          showCancelButton: true,
          inputValidator: (value) => {
            return new Promise((resolve) => {
              if (value) {
                setDorSelect(value);
                resolve();
              } else {
                resolve("기숙사를 선택해주세요!");
              }
            });
          }
        });
      }

      const handleSwalCate= async () => {
        const { value } = await Swal.fire({
          confirmButtonColor:"#FF8C00",
          title: "카테고리",
          confirmButtonText:"선택",
          cancelButtonText:"취소",
          input: "select",
          inputOptions: {
            "배달":"배달",
            "공동 주문":"공동 주문",
            "택시/카폴":"택시/카폴",
            "기타":"기타"
          },
          inputPlaceholder: "카테고리를 선택해요.",
          showCancelButton: true,
          inputValidator: (value) => {
            return new Promise((resolve) => {
              if (value) {
                setCateSelect(value);
                resolve();
                
              } else {
                resolve("카테고리를 선택해주세요!");
              }
            });
          }
        });
      }

    const processNext = async () => {
        if(title==="" || content===""){
            toast.error("비워진 부분이 있어요! ");
            return;
        }
        if(limitedPatch==1){
          setDorSelect(article.dorId);
          setCateSelect(article.category);
        }
        else{
          handleSwalDorm()
          .then(()=>handleSwalCate());
        }
    }

    const postArticle = async () => {
        const fullPath = `${process.env.REACT_APP_HTTP_API_URL}/article/new`;
        const data = {
          title:title,
          contentHTML:content,
          dormId: dorSelect,
          category:cateSelect
        };

        if(targetId!=0){
          patchArticle();
          return ;
        }
      
        try {
        const response = await axios.post(fullPath, data, {
            headers: {
            'Authorization':`${token}`,
            }
        });
        window.location.reload();
        } catch (error) {
            if(error.response.data==="유효하지 않은 토큰입니다."){
                localStorage.setItem("nextIndex",6);
                toast.error("회원 정보가 유효하지 않아요! 로그인해주세요.");
                setSelectComponentIndex(8);   
            }
            console.error(error);
        }finally{
          setCateSelect("카테고리");
          setDorSelect("기숙사");
        }
    }

    const patchArticle = async () => {
      console.log(dorSelect);
      console.log(cateSelect);
      const data = {
        dormId: dorSelect,
        category:cateSelect,
        title:title,
        contentHTML:content
      };
      console.log(data);
      const path=`${process.env.REACT_APP_HTTP_API_URL}/article/${targetId}`;
      try{
        const response= await axios.patch(path,data,{
          headers:{
            'Authorization':`${token}`,
          }
        });
        window.location.reload();
      }catch(error){
        if(error.response.data==="유효하지 않은 토큰입니다."){
          localStorage.setItem("nextIndex",6);
          toast.error("회원 정보가 유효하지 않아요! 로그인해주세요.");
          setSelectComponentIndex(8);
        }
      }
    }
    
    return (
        <div className="App">
            <header className="App-postingPage-header">
                    <BackButton></BackButton>
                    <h6>{pageTitle}</h6> 
                    <div className='write-next-button' onClick={processNext}>{buttonText}</div>       
            </header>                 
            <main className="App-postingPage-main">
                <input type="text" value={title} placeholder='제목' style={{border:'none',outline:'none',width:'90%'}} onChange={e => setTitle(e.target.value)}  />
                <br/><br/>
                <textarea value={content} placeholder='내용을 입력하세요.' style={{border:'none',outline:'none',width:'90%',height:'90%'}} onChange={e => setContent(e.target.value)}  />
                <br />
            </main>
            

        </div>
        

    );
}

export default PostingPage;

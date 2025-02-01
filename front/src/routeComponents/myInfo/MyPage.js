import userDefault from '../../images/userDefault.png';
import BackButton from "../../components/home/BackButton";
import ForwardButton from '../../components/myInfo/ForwardButton';
import { useContext, useEffect, useRef, useState } from 'react';
import HomeSelectContext from '../../components/home/HomeSelectContext';
import axios from 'axios';
import { dorIdToDorName } from '../../components/home/HomeUtils';
import Modal from '../../components/common/Modal';
import ModalContext from '../../components/common/ModalContext';
import PasswordChangeForm from '../../components/common/modalForms/myInfo/PasswordChangeForm';
import DormitoryChangeForm from '../../components/common/modalForms/myInfo/DormitoryChangeForm';
import InquireForm from '../../components/common/modalForms/myInfo/InquireForm';
import LogoutForm from '../../components/common/modalForms/myInfo/LogoutForm';
import UserDeletionForm from '../../components/common/modalForms/myInfo/UserDeletionForm';
import RestrictionForm from '../../components/common/modalForms/myInfo/RestrictionForm';
import ProfileChangeForm from '../../components/common/modalForms/myInfo/ProfileChangeForm';
import { toast } from 'react-toastify';

const MyPage = () => {
    const {selectComponentIndex,setSelectComponentIndex}=useContext(HomeSelectContext);
    const {isOpen, openModal, closeModal}=useContext(ModalContext);
    const [user,setUser]=useState({});
    const [profileImage,setProfileImage]=useState(userDefault);
    const token=localStorage.getItem("token");

    const changePassword = (modalContent) => {
        openModal(modalContent);
    }

    const changeDormitory = (modalContent) => {
        openModal(modalContent);
    }

    const makeInquiry = (modalContent) => {
        openModal(modalContent);
    }

    const logout = (modalContent) => {
        openModal(modalContent);
    }

    const ChangeProfile = (modalContent) => {
        openModal(modalContent)
    }

    const getUser = async () => {
        const pathUserId=`${process.env.REACT_APP_HTTP_API_URL}/token/userId`;
        try {
            const response = await axios.get(pathUserId, {headers: {'Authorization': `${token}`}});
            const userId=response.data;
            try{
                const pathUser=`${process.env.REACT_APP_HTTP_API_URL}/user/${userId}`;
                const response2=await axios.get(pathUser);
                setUser(response2.data);
            }catch(error){
                console.error(error);
            }
        } catch (error) {
            console.error(error);
        }
    }

    /*
    const getUserProfileImage = async (token) => {
        try{
            const headers={
                responseType:'arraybuffer',
            }; 
            const response=await axios.get(`${process.env.REACT_APP_HTTP_API_URL}/user/image?Authorization=${token}`,{headers});

            const blob=new Blob([response.data], {type:'image/jpeg'});
            const imageUrl=URL.createObjectURL(blob);
            console.log(imageUrl);
            setProfileImage(imageUrl);
        }catch(error){
            if(error.response.data==="UserHasNoProfileImage"){
                return ;
            }
            else if(error.response.data==="InvalidToken"){
                toast.error("회원 정보가 유효하지 않아요, 다시 로그인해주세요.");
            }
            console.error(error);
        }
    }
    */

    
    useEffect(()=>{
        getUser();
    },[])

    useEffect(()=>{
        if(profileImage!=null){
            return ;
        }
        setProfileImage(userDefault);
    },[profileImage])

    /*
    useEffect(()=>{
        if(profileImage!=userDefault){
            return ;
        }
        if(token==null){
            return ;
        }
        getUserProfileImage(token);
    })
        */


    return (
        <div className="App">
            <div className="App-header-myPage">
                <BackButton/>
            </div>
            <div className="App-main-myPage">
                <div className="myPage-profile">
                    <div className="profile-image">
                        <img src={profileImage} alt="description" onClick={()=>ChangeProfile(<ProfileChangeForm setProfileImage={setProfileImage}/>)}/>
                    </div>
                    <div className="profile-details">
                        <div className="details-nickName">{user.nickName}</div>
                        <div className="details-dormitory">{user.dormId ? dorIdToDorName[user.dormId] : "?"}</div>
                    </div>
                </div>
                <div className="myPage-info">
                    <div className="info-writings" onClick={() => setSelectComponentIndex(11)}>
                        <div>내 글</div>
                        <div><ForwardButton/></div>
                    </div>
                    <div className="info-account">
                        <div className='info-title'>계정</div>
                        <div className="account-id">
                            <div>아이디(이메일)</div>
                            <div>{user.email}</div>
                        </div>
                        <div className="account-changePassWord" onClick={()=>changePassword(<PasswordChangeForm userId={user.id}/>)}>
                            <div>비밀번호 바꾸기</div>
                            <div><Modal/></div>
                        </div>
                        <div className="account-changeDormitory" onClick={()=>changeDormitory(<DormitoryChangeForm userId={user.id}/>)}>
                            <div>기숙사 바꾸기</div>
                        </div>
                    </div>
                    <div className="info-community">
                    <div className='info-title'>커뮤니티</div>
                        <div className="community-restrictionDetails" onClick={()=>openModal(<RestrictionForm/>)}>
                            <div>커뮤니티 이용 제한사항</div>
                        </div>
                        <div className="community-guide">
                            <div>커뮤니티 이용 수칙</div>
                        </div>
                    </div>
                    <div className="etc">
                    <div className='info-title'>기타</div>
                        <div className="etc-inquiry" onClick={()=>makeInquiry(<InquireForm/>)}>
                            <div>문의하기</div>
                        </div>
                        <div className="etc-logOut" onClick={()=>logout(<LogoutForm/>)}>
                            <div>로그아웃 하기</div>
                        </div>
                        <div className="etc-deleteAccount" onClick={()=>openModal(<UserDeletionForm userId={user.id}/>)}>
                            <div>계정 탈퇴하기</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default MyPage;
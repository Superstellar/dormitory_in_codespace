import {React,useContext, useEffect, useState} from 'react'
import 'bootstrap/dist/css/bootstrap.css'; 
import 'bootstrap/dist/js/bootstrap.js'; 
import HomeSelectContext from '../home/HomeSelectContext';
import ModalContext from '../common/ModalContext';
import Modal from '../common/Modal';
import SignInForm from '../modalForms/signIn/SignUpForm';
import EmailVerifyForm from '../modalForms/signIn/EmailVerifyForm';
import SignUpForm from '../modalForms/signIn/SignUpForm';


const Options = () => {
    const {selectComponentIndex,setSelectComponentIndex}=useContext(HomeSelectContext);
    const {isOpen, openModal, closeModal}=useContext(ModalContext);
    const[verifyFinished, setVerifyFinished]=useState(false);
    const[signUpEmail,setSignUpEmail]=useState("");

    let emailDetails;
    const verifyEmail = (modalContent) => {
        openModal(modalContent);
    }

    const signUp = (modalContent) => {
        openModal(modalContent);
    }
    
    const initPW = (modalContent) => {
        openModal(modalContent);
    }

    useEffect(()=>{
        console.log(signUpEmail);
        if(signUpEmail.length===0){
            return ;
        }
        emailDetails={email:signUpEmail,type:"LOCAL"} //local or provider(GOOGLE or NAVER...)
        signUp(<SignUpForm emailDetails={emailDetails}/>)
    },[signUpEmail])

    return (
        <div className="continer options-container">
            <div><Modal/></div>
            <div className="options-row mt-1">
                <div className="" onClick={()=>verifyEmail(<EmailVerifyForm setSingUpEmail={setSignUpEmail}/>)}>회원가입</div>
                <div className="" onClick={()=>initPW(<div>비번 초기화</div>)}>비밀번호 초기화</div>
            </div>
            <div className="separator mt-4">혹은</div>
        </div> 
    );
};

export default Options;

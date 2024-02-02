import './App.css';
import LogInPage from './routeComponents/logIn/LogInPage';
import {Routes,Route,BrowserRouter} from "react-router-dom";
import SignInPage from './routeComponents/signIn/SignInPage';
import HomePage from './routeComponents/home/HomePage';
import WritingPage from './routeComponents/home/WritingPage';
import MyWritingPage from './routeComponents/home/MyWritingPage';
import AlarmPage from './routeComponents/home/AlarmPage';
import ArticlePage from './routeComponents/article/ArticlePage';
import React,{useState,useContext} from 'react';
import { ToastContainer} from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import TestContext from './components/common/TestContext';

function App() {
  const testFunction= () => {
    console.log("전역 함수");
  };
  
  return (
    <div className="App">
      <ToastContainer
        className="toast-position"
        position='top-center'/>


      <TestContext.Provider value={testFunction}>
        <BrowserRouter>
          <Routes>
            <Route exact path="/" element={<HomePage/>}></Route> 
            <Route path="/newWriting" element={<WritingPage/>}></Route>
            <Route path="/myWriting" element={<MyWritingPage/>}></Route>
            <Route path="/alarm" element={<AlarmPage/>}></Route>

            <Route path="/article" element={<ArticlePage/>}></Route>
            
            <Route path="/signIn" element={<SignInPage/>}></Route>
            <Route path="/logIn" element={<LogInPage/>}></Route>
          </Routes>
        </BrowserRouter>
      </TestContext.Provider>

      
    </div>


  );
}



export default App;


import { useNavigate } from "react-router-dom"
import { BottomWarning } from "../components/BottomWarning"
import { Button } from "../components/Button"
import { Heading } from "../components/Heading"
import { InputBox } from "../components/InputBox"
import { SubHeading } from "../components/SubHeading"
import axios from "axios"
import { useState } from "react"



export const Signin = () => {
    const[username,setUsername]=useState("");
    const[password,setPassword]=useState("");
    const navigate=useNavigate();
    return <div className="bg-slate-300 h-screen flex justify-center">
    <div className="flex flex-col justify-center">
      <div className="rounded-lg bg-white w-80 text-center p-2 h-max px-4">
        <Heading label={"Sign in"} />
        <SubHeading label={"Enter your credentials to access your account"} />
        <InputBox placeholder="sid@gmail.com" label={"Email"} onChange={(e)=>{
            setUsername(e.target.value);
        }} />
        <InputBox placeholder="123456" label={"Password"}    onChange={(e) => {
              setPassword(e.target.value);
            }} />
        <div className="pt-4">
          <Button onClick={async()=>{
            //now find the user and match the password and email
            try{
              console.log("Sending data:",{
                username,
                password,
              });
              
                const response=await axios.post("http://localhost:3000/api/auth/signin",{
                    username,
                    password,
                })
                navigate("/Home");
            }catch (error) {
                console.error(
                  "Signin error:",
                  error.response?.data || error.message
                );
                alert("Signin failed. Error: " + (error.response?.data?.error || error.message));
              }
          }} label={"Sign in"} />
          
        </div>
        <BottomWarning label={"Don't have an account?"} buttonText={"Sign up"} to={"/"} />
      </div>
    </div>
  </div>
}

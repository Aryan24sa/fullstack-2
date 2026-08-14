import {configureStore,createSlice} from '@reduxjs/toolkit';
const posts=createSlice({name:'posts',initialState:[{id:1,title:'Hello'}],reducers:{addPost:(s,a)=>{s.push({id:Date.now(),title:a.payload})}}});
export const {addPost}=posts.actions;
export default configureStore({reducer:{posts:posts.reducer}});
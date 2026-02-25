/**
 * @license MIT
 * Copyright (c) 2025 SGNL.ai, Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
"use strict";const e="SGNL-CAEP-Hub/2.0";async function t(t){const n=t.environment||{},r=t.secrets||{};if(r.BEARER_AUTH_TOKEN){const e=r.BEARER_AUTH_TOKEN;return e.startsWith("Bearer ")?e:`Bearer ${e}`}if(r.BASIC_PASSWORD&&r.BASIC_USERNAME){return`Basic ${btoa(`${r.BASIC_USERNAME}:${r.BASIC_PASSWORD}`)}`}if(r.OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN){const e=r.OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN;return e.startsWith("Bearer ")?e:`Bearer ${e}`}if(r.OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET){const t=n.OAUTH2_CLIENT_CREDENTIALS_TOKEN_URL,s=n.OAUTH2_CLIENT_CREDENTIALS_CLIENT_ID,o=r.OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET;if(!t||!s)throw new Error("OAuth2 Client Credentials flow requires TOKEN_URL and CLIENT_ID in env");const a=await async function(t){const{tokenUrl:n,clientId:r,clientSecret:s,scope:o,audience:a,authStyle:i}=t;if(!n||!r||!s)throw new Error("OAuth2 Client Credentials flow requires tokenUrl, clientId, and clientSecret");const c=new URLSearchParams;c.append("grant_type","client_credentials"),o&&c.append("scope",o),a&&c.append("audience",a);const E={"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json","User-Agent":e};if("InParams"===i)c.append("client_id",r),c.append("client_secret",s);else{const e=btoa(`${r}:${s}`);E.Authorization=`Basic ${e}`}const u=await fetch(n,{method:"POST",headers:E,body:c.toString()});if(!u.ok){let e;try{const t=await u.json();e=JSON.stringify(t)}catch{e=await u.text()}throw new Error(`OAuth2 token request failed: ${u.status} ${u.statusText} - ${e}`)}const _=await u.json();if(!_.access_token)throw new Error("No access_token in OAuth2 response");return _.access_token}({tokenUrl:t,clientId:s,clientSecret:o,scope:n.OAUTH2_CLIENT_CREDENTIALS_SCOPE,audience:n.OAUTH2_CLIENT_CREDENTIALS_AUDIENCE,authStyle:n.OAUTH2_CLIENT_CREDENTIALS_AUTH_STYLE});return`Bearer ${a}`}throw new Error("No authentication configured. Provide one of: BEARER_AUTH_TOKEN, BASIC_USERNAME/BASIC_PASSWORD, OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN, or OAUTH2_CLIENT_CREDENTIALS_*")}var n={invoke:async(n,r)=>{const s=function(e,t){const n=t.environment||{},r=e?.address||n.ADDRESS;if(!r)throw new Error("No URL specified. Provide address parameter or ADDRESS environment variable");return r.endsWith("/")?r.slice(0,-1):r}(n,r),o=await async function(n){return{Authorization:await t(n),Accept:"application/json","Content-Type":"application/json","User-Agent":e}}(r);if(!n.userPrincipalName||"string"!=typeof n.userPrincipalName||!n.userPrincipalName.trim())throw new Error("userPrincipalName parameter is required and cannot be empty");console.log(`Revoking sessions for user: ${n.userPrincipalName}`);const a=await async function(e,t,n){const r=`${t}/v1.0/users/${encodeURIComponent(e)}/revokeSignInSessions`;return await fetch(r,{method:"POST",headers:n})}(n.userPrincipalName,s,o);if(!a.ok){const e=await a.text();throw new Error(`Failed to revoke sessions: ${a.status} ${a.statusText}. Details: ${e}`)}const i=await a.json();return console.log(`Successfully revoked sessions for user: ${n.userPrincipalName}`),{status:"success",userPrincipalName:n.userPrincipalName,value:i.value||!0,address:s}},error:async(e,t)=>{const{error:n,userPrincipalName:r}=e;throw console.error(`Session revocation failed for ${r}: ${n.message}`),n},halt:async(e,t)=>{const{reason:n}=e;return console.log(`Session revocation halted: ${n}`),{status:"halted",userPrincipalName:e.userPrincipalName||"unknown",reason:n}}};module.exports=n;

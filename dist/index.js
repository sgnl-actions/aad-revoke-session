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
"use strict";const e="SGNL-CAEP-Hub/2.0";async function n(n){const t=n.environment||{},r=n.secrets||{};if(r.BEARER_AUTH_TOKEN){const e=r.BEARER_AUTH_TOKEN;return e.startsWith("Bearer ")?e:`Bearer ${e}`}if(r.BASIC_PASSWORD&&r.BASIC_USERNAME){return`Basic ${btoa(`${r.BASIC_USERNAME}:${r.BASIC_PASSWORD}`)}`}if(r.OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN){const e=r.OAUTH2_AUTHORIZATION_CODE_ACCESS_TOKEN;return e.startsWith("Bearer ")?e:`Bearer ${e}`}if(r.OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET){const n=t.OAUTH2_CLIENT_CREDENTIALS_TOKEN_URL,s=t.OAUTH2_CLIENT_CREDENTIALS_CLIENT_ID,a=r.OAUTH2_CLIENT_CREDENTIALS_CLIENT_SECRET;if(!n||!s)throw new Error("OAuth2 Client Credentials flow requires TOKEN_URL and CLIENT_ID in env");const o=await async function(n){const{tokenUrl:t,clientId:r,clientSecret:s,scope:a,audience:o,authStyle:i}=n;if(!t||!r||!s)throw new Error("OAuth2 Client Credentials flow requires tokenUrl, clientId, and clientSecret");const c=new URLSearchParams;c.append("grant_type","client_credentials"),a&&c.append("scope",a),o&&c.append("audience",o);const u={"Content-Type":"application/x-www-form-urlencoded",Accept:"application/json","User-Agent":e};if("InParams"===i)c.append("client_id",r),c.append("client_secret",s);else{const e=btoa(`${r}:${s}`);u.Authorization=`Basic ${e}`}const E=await fetch(t,{method:"POST",headers:u,body:c.toString()});if(!E.ok){const e=await E.text();throw new Error(`OAuth2 token request failed: ${E.status} ${E.statusText} - ${e}`)}const l=await E.json();if(!l.access_token)throw new Error("No access_token in OAuth2 response");return l.access_token}({tokenUrl:n,clientId:s,clientSecret:a,scope:t.OAUTH2_CLIENT_CREDENTIALS_SCOPE,audience:t.OAUTH2_CLIENT_CREDENTIALS_AUDIENCE,authStyle:t.OAUTH2_CLIENT_CREDENTIALS_AUTH_STYLE});return`Bearer ${o}`}return""}var t={invoke:async(t,r)=>{const s=function(e,n){const t=n.environment||{},r=e?.address||t.ADDRESS;if(!r)throw new Error("No URL specified. Provide address parameter or ADDRESS environment variable");return r.endsWith("/")?r.slice(0,-1):r}(t,r),a=await async function(t){const r=await n(t),s={Accept:"application/json","Content-Type":"application/json","User-Agent":e};return r&&(s.Authorization=r),s}(r);if(!t.userPrincipalName||"string"!=typeof t.userPrincipalName||!t.userPrincipalName.trim())throw new Error("userPrincipalName parameter is required and cannot be empty");console.log(`Revoking sessions for user: ${t.userPrincipalName}`);const o=await async function(e,n,t){const r=`${n}/v1.0/users/${encodeURIComponent(e)}/revokeSignInSessions`;return await fetch(r,{method:"POST",headers:t})}(t.userPrincipalName,s,a);if(!o.ok){const e=await o.text();throw new Error(`Failed to revoke sessions: ${o.status} ${o.statusText}. Details: ${e}`)}const i=await o.json();return console.log(`Successfully revoked sessions for user: ${t.userPrincipalName}`),{status:"success",userPrincipalName:t.userPrincipalName,value:i.value||!0,address:s}},error:async(e,n)=>{const{error:t,userPrincipalName:r}=e;throw console.error(`Session revocation failed for ${r}: ${t.message}`),t},halt:async(e,n)=>{const{reason:t}=e;return console.log(`Session revocation halted: ${t}`),{status:"halted",userPrincipalName:e.userPrincipalName||"unknown",reason:t}}};module.exports=t;

"use strict";(self.webpackChunkcins_admin=self.webpackChunkcins_admin||[]).push([[35],{8558:function(e,n,l){l.r(n),l.d(n,{default:function(){return Q}});var t=l(9439),a=l(2791),s=l(6871),i=l(6053),o=l(32),c=l(586),r=l(8222),d=l(3621),h=l(5546),m="layout_layout__WkQjN",_="layout_trigger__kye+x",u="layout_site-layout__Lpk79",y="layout_site-layout-background__hr07z",g="layout_header_logo__bYZXj",f="layout_aside__09bLY",j=l(6014),x=l(3168),p=l(332),C="sider_logo__Zu-lh",v=l(184);var b=(0,o.Pi)((function(e){var n=e.collapsed,l=e.setVisible,o=(0,i.o)().configStore,c=(0,x.$)().t,r=(0,s.s0)(),d=(0,s.TH)(),h=(0,a.useState)([{key:"system",icon:(0,v.jsx)(p.Z,{}),label:c("aside.system.nav"),children:[{key:"settingKey",label:c("aside.system.setting_key"),onClick:function(){r("/settingKey")}},{key:"settingCoin",label:c("aside.system.setting_coin"),onClick:function(){r("/settingCoin")}},{key:"showLogs",label:c("aside.system.show_logs"),onClick:function(){r("/showLogs")}}]}]),m=(0,t.Z)(h,1)[0];return(0,a.useEffect)((function(){var e,n,l=JSON.parse(localStorage.getItem("activeItem")),t=JSON.parse(localStorage.getItem("parentItem"));t&&(t=m.find((function(e){return e.key===t.key}))),m.forEach((function(e){var n=e.children.find((function(e){return e.path===d.pathname}));n&&(l=n)})),void 0!==(null===(e=l)||void 0===e?void 0:e.label)&&null!==(null===(n=l)||void 0===n?void 0:n.label)&&"/"!==d.pathname&&(o.switchMenuItem(l),o.operateCrumbMenu(t))}),[o,d.pathname,m]),(0,v.jsxs)(v.Fragment,{children:[(0,v.jsx)("div",{className:C,onClick:function(){o.crumbItem(),r("/",{replace:!0})},children:n?"".concat("\u91cf"):"\u91cf\u5316"}),(0,v.jsx)(j.Z,{items:m,theme:o.themeStyle,mode:"inline",selectedKeys:[o.activeItem.key],onClick:function(e){var n=e.keyPath[1],t=m.find((function(e){return e.key===n})),a=t.children.find((function(n){return n.key===e.key}));o.operateCrumbMenu(t),o.switchMenuItem(a),void 0!==l&&l(!1)}})]})})),k="header_header__jtTCa",N="header_header_right__-Hy60",S="header_locales__8znyt",Z="header_user__NpW2f",w="header_setting__J+vfb",z="header_setting_drawer__+6owj",I="header_panel_style__zmbRc",U="header_title__ozB82",F="header_diffstyles__FfUAO",E="header_selected__lC0BO",D="header_theme_color__2RYDN",B="header_colors__x4xr-",L=l(8164),O=l(2385),P=l(7734),A=l(5945),H=l(2444),R=l(9771),W=l(2414),G=l(7575);var K=l.p+"static/media/dark.0fe93e5b4e03ab3cbf2473fcc54be41f.svg";var M=l.p+"static/media/light.7f08f7e4b20a0da51bdcd6a3f1306bef.svg",J=l.p+"static/media/logo.9b0a8e601df298cba098.png";var V=(0,o.Pi)((function(e){var n,l=e.width,o=(0,i.o)(),c=o.configStore,d=o.loginStore,h=(0,x.$)().t,m=(0,s.s0)(),_=(0,a.useState)(["zh_CN"]),u=(0,t.Z)(_,2),y=u[0],g=u[1],f=(0,a.useState)(!1),p=(0,t.Z)(f,2),C=p[0],b=p[1];(0,a.useEffect)((function(){localStorage.getItem("locale")&&g([localStorage.getItem("locale")])}),[]);var V=[{zh_CN_name:"\u6697\u8272\u83dc\u5355\u98ce\u683c",en_US_name:"Dark style",style:"dark",icon:K},{zh_CN_name:"\u4eae\u8272\u83dc\u5355\u98ce\u683c",en_US_name:"Light style",style:"light",icon:M}],Y=(0,v.jsx)(j.Z,{items:[{key:"zh_CN",label:"\ud83c\udde8\ud83c\uddf3 \u7b80\u4f53\u4e2d\u6587"},{key:"en_US",label:"\ud83c\uddec\ud83c\udde7 English"}],onClick:function(e){var n=e.key;y[0]!==n&&(g([n]),c.switchLanguage(n),window.location.reload())},selectedKeys:y}),T=(0,v.jsx)(j.Z,{items:[{key:"logout",icon:(0,v.jsx)(H.Z,{}),label:h("login.loginOut")}],onClick:function(e){"logout"===e.key&&(d.logout(),m("/login",{replace:!0}))}});return(0,v.jsxs)("div",{className:k,children:[(0,v.jsx)(L.Z,{children:null!==(n=c.activeItem)&&void 0!==n&&n.label&&l>500?(0,v.jsxs)(v.Fragment,{children:[(0,v.jsx)(L.Z.Item,{children:c.parentItem.label}),(0,v.jsx)(L.Z.Item,{children:c.activeItem.label})]}):""}),(0,v.jsxs)("div",{className:N,children:[(0,v.jsx)(O.Z,{overlay:T,placement:"bottomRight",children:(0,v.jsx)("div",{className:Z,children:(0,v.jsx)(P.C,{src:J})})}),(0,v.jsx)(O.Z,{overlay:Y,placement:"bottomRight",children:(0,v.jsx)("div",{className:S,children:(0,v.jsx)(R.Z,{})})}),(0,v.jsx)("div",{className:w,onClick:function(){return b(!0)},children:(0,v.jsx)(W.Z,{})})]}),(0,v.jsxs)(r.Z,{width:280,className:z,placement:"right",visible:C,onClose:function(){return b(!1)},closable:!1,children:[(0,v.jsxs)("div",{className:I,children:[(0,v.jsx)("h3",{className:U,children:h("header.page_style")}),(0,v.jsx)("div",{className:F,children:V.map((function(e){return(0,v.jsxs)("span",{onClick:function(){return c.switchStyle(e.style)},children:[(0,v.jsx)(A.Z,{title:e[c.locale+"_name"],color:c.theme.primaryColor+"B3",children:(0,v.jsx)("img",{src:e.icon,alt:""})},c.theme.primaryColor),c.themeStyle===e.style?(0,v.jsx)(G.Z,{className:E,style:{color:c.theme.primaryColor}}):""]},e.style)}))})]}),(0,v.jsxs)("div",{className:D,children:[(0,v.jsx)("h3",{className:U,children:h("header.theme_color")}),(0,v.jsx)("div",{className:B,children:[{zh_CN_name:"\u8584\u66ae",en_US_name:"Dust Red",color:"#F5222D"},{zh_CN_name:"\u706b\u5c71",en_US_name:"Volcano",color:"#FA541C"},{zh_CN_name:"\u65e5\u66ae",en_US_name:"Sunset Orange",color:"#FAAD14"},{zh_CN_name:"\u660e\u9752",en_US_name:"Cyan",color:"#13C2C2"},{zh_CN_name:"\u6781\u5149\u7eff",en_US_name:"Polar Green",color:"#52C41A"},{zh_CN_name:"\u62c2\u6653\u84dd\uff08\u9ed8\u8ba4\uff09",en_US_name:"Daybreak Blue (default)",color:"#1890FF"},{zh_CN_name:"\u6781\u5ba2\u84dd",en_US_name:"Geek Glue",color:"#2F54EB"},{zh_CN_name:"\u9171\u7d2b",en_US_name:"Golden Purple",color:"#722ED1"}].map((function(e){return(0,v.jsx)(A.Z,{title:e[c.locale+"_name"],color:e.color+"B3",children:(0,v.jsx)("span",{style:{background:e.color},onClick:function(){return c.switchColor(e.color)},children:c.theme.primaryColor===e.color?(0,v.jsx)(G.Z,{}):""})},e.color)}))})]})]})]})})),Y=c.Z.Header,T=c.Z.Content,$=c.Z.Sider;var Q=(0,o.Pi)((function(){var e=(0,i.o)().configStore,n=(0,s.s0)(),l=(0,a.useState)(!1),o=(0,t.Z)(l,2),j=o[0],x=o[1],p=(0,a.useState)(!1),C=(0,t.Z)(p,2),k=C[0],N=C[1],S=(0,a.useState)(window.innerWidth),Z=(0,t.Z)(S,2),w=Z[0],z=Z[1];return window.onresize=function(){z(window.innerWidth)},(0,a.useEffect)((function(){x(w<650)}),[w]),(0,v.jsxs)(c.Z,{className:m,children:[w<650?(0,v.jsx)(r.Z,{placement:"left",width:"50%",visible:k,onClose:function(){N(!1)},closable:!1,bodyStyle:{padding:0},children:(0,v.jsx)($,{width:"100%",style:{height:"100%"},collapsedWidth:0,theme:e.themeStyle,trigger:null,className:f,children:(0,v.jsx)(b,{setVisible:N})})}):(0,v.jsx)($,{width:"230",theme:e.themeStyle,trigger:null,collapsible:!0,collapsed:j,className:f,children:(0,v.jsx)(b,{collapsed:j})}),(0,v.jsxs)(c.Z,{className:u,children:[(0,v.jsxs)(Y,{className:y,style:{display:"flex",padding:0,alignItems:"center"},children:[w<650?(0,v.jsx)("span",{className:g,onClick:function(){e.crumbItem(),n("/",{replace:!0})},children:"\u91cf"}):"",a.createElement(j?d.Z:h.Z,{className:_,onClick:function(){w>650&&x(!j),N(!0)}}),(0,v.jsx)(V,{width:w})]}),(0,v.jsx)(T,{className:y,style:{margin:w<650?4:10,padding:w<650?10:16,minHeight:.9*window.innerHeight,overflow:"hidden",position:"relative"},children:(0,v.jsx)(a.Suspense,{children:(0,v.jsx)(s.j3,{})})})]})]})}))}}]);
//# sourceMappingURL=35.8842b432.chunk.js.map
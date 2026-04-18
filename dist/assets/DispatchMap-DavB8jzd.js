import{j as n}from"./index-B418SGQB.js";import{a as g}from"./vendor-DDLslikZ.js";import{M as u,T as f,a as c,C as b,u as j,P as x,L as l}from"./leaflet-CmRN4onu.js";import"./socketio-BIIei4U1.js";delete l.Icon.Default.prototype._getIconUrl;l.Icon.Default.mergeOptions({iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"});const y=l.divIcon({className:"",html:`<div style="
    width:16px;height:16px;border-radius:50%;
    background:#f97316;border:3px solid #fff;
    box-shadow:0 2px 8px rgba(249,115,22,0.5)
  "></div>`,iconSize:[16,16],iconAnchor:[8,8]}),w=l.divIcon({className:"",html:`<div style="
    width:16px;height:16px;border-radius:50%;
    background:#fff;border:3px solid #1a6b7a;
    box-shadow:0 2px 8px rgba(13,79,92,0.3)
  "></div>`,iconSize:[16,16],iconAnchor:[8,8]}),v=l.divIcon({className:"",html:`<div style="
    width:32px;height:32px;border-radius:50%;
    background:#0d4f5c;border:2px solid #fff;
    box-shadow:0 3px 12px rgba(13,79,92,0.4);
    display:flex;align-items:center;justify-content:center;
    font-size:16px;
  ">🚗</div>`,iconSize:[32,32],iconAnchor:[16,16]});function I({center:e}){const t=j();return g.useEffect(()=>{t.setView([e.lat,e.lng],t.getZoom())},[e]),null}function C({pickup:e,dropoff:t}){const[o,s]=g.useState([]);return g.useEffect(()=>{fetch(`https://router.project-osrm.org/route/v1/driving/${e.lng},${e.lat};${t.lng},${t.lat}?overview=full&geometries=geojson`).then(a=>a.json()).then(a=>{var i,h,d;const r=(d=(h=(i=a.routes)==null?void 0:i[0])==null?void 0:h.geometry)==null?void 0:d.coordinates;r&&s(r.map(([m,p])=>[p,m]))}).catch(()=>s([[e.lat,e.lng],[t.lat,t.lng]]))},[e.lat,e.lng,t.lat,t.lng]),o.length?n.jsxs(n.Fragment,{children:[n.jsx(x,{positions:o,pathOptions:{color:"#0d4f5c",weight:5,opacity:.8,lineCap:"round",lineJoin:"round"}}),n.jsx(x,{positions:o,pathOptions:{color:"#f97316",weight:3,opacity:.6,lineCap:"round",dashArray:"8 6"}})]}):null}function S({center:e,pickup:t,dropoff:o,driverLocation:s,height:a="100%",onMapClick:r}){const i=e??t??o??{lat:-29.3167,lng:27.4833};return n.jsxs(u,{center:[i.lat,i.lng],zoom:14,style:{width:"100%",height:a},zoomControl:!1,attributionControl:!1,children:[n.jsx(f,{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",attribution:""}),e&&n.jsx(I,{center:e}),t&&o&&n.jsx(C,{pickup:t,dropoff:o}),t&&n.jsx(c,{position:[t.lat,t.lng],icon:y}),o&&n.jsx(c,{position:[o.lat,o.lng],icon:w}),s&&n.jsxs(n.Fragment,{children:[n.jsx(c,{position:[s.lat,s.lng],icon:v}),n.jsx(b,{center:[s.lat,s.lng],radius:28,pathOptions:{color:"#f97316",fill:!0,fillOpacity:.1,weight:0}})]})]})}export{S as default};

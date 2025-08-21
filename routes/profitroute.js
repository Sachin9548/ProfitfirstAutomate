import express from "express";
import {AnalyticsData, getAnalyticsChart} from "../controller/profitfirst/analytic.js";
import auth from '../middleware/auth.js';
import {marketingData} from "../controller/profitfirst/marketing.js";
import {shipping} from "../controller/profitfirst/shipping.js";
import {dashboard} from "../controller/profitfirst/dashboard.js";
import {getDataAi} from "../controller/getDataAi.js";
import chat from "../controller/chat.js";
import {getProductsWithCosts, updateProductCosts} from "../controller/profitfirst/productmanufaturing.js";
 
const router = express.Router();

router.get("/dashboard",auth,dashboard);
router.get("/analytics",auth,AnalyticsData);
router.get("/analyticschart",auth,getAnalyticsChart);
router.get("/marketingData",auth,marketingData); 
router.get("/shipping",auth,shipping);
router.post("/chat",auth,chat);
router.get("/getData",auth,getDataAi);

// too update the product manufaturing cost 
router.get('/all-with-costs',auth, getProductsWithCosts);
router.post('/update-costs',auth, updateProductCosts);
export default router;
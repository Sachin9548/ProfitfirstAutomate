import express from "express";
import {AnalyticsData, getAnalyticsChart} from "../controller/profitfirst/analytic.js";
import auth from '../middleware/auth.js';
import {marketingData} from "../controller/profitfirst/marketing.js";
import {shipping} from "../controller/profitfirst/shipping.js";
import {dashboard} from "../controller/profitfirst/dashboard.js";
import {getDataAi} from "../controller/getDataAi.js";
import chat from "../controller/chat.js";

const router = express.Router();

router.get("/dashboard",auth,dashboard);
router.get("/analytics",auth,AnalyticsData);
router.get("/analyticschart",auth,getAnalyticsChart);
router.get("/marketingData",auth,marketingData);
router.get("/shipping",auth,shipping);
router.post("/chat",auth,chat);
router.get("/getData",auth,getDataAi);
export default router;
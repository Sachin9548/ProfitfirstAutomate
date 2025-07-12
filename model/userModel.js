import mongoose from "mongoose";
const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    step: {
      type: Number,
      default: 1,
    },
    onboarding: {
      step1: {
        fullName: {
          type: String,
          default: "",
        },
        email: {
          type: String,
          default: "",
        },
        phone: {
          type: String,
          default: "",
        },
        whatsapp: {
          type: String,
          default: "",
        },
        industry: {
          type: String,
          default: "",
        },
        referral: {
          type: String,
          default: null,
        },
      },
      step2: {
        storeUrl: {
          type: String,
          default: "",
        },
        apiKey: {
          type: String,
          default: "",
        },
        apiSecret: {
          type: String,
          default: "",
        },
        accessToken: {
          type: String,
          default: "",
        },
        platform: {
          type: String,
          default: "Shopify",
        },
      },
      step4: {
        adAccountId: {
          type: String,
          default: "",
        },
        accessToken: {
          type: String,
          default: "",
        },
        createAt: {
          type: Date,
          default: Date.now,
        },
      },
      step5: {
        shiproactId: {
          type: String,
          default: "",
        },
        shiproactPassword: {
          type: String,
          default: "",
        },
        token: {
          type: String,
          default: "",
        },
        created_at: {
          type: Date,
          default: Date.now,
        },
        platform: {
          type: String,
          default: "Shiprocket",
        },
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
export default User;

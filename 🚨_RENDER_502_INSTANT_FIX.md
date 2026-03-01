# 🚨 RENDER 502 ERROR - INSTANT FIX

## ❌ **ISSUE**: 502 Bad Gateway on seltech.online

**Error**: "This service is currently unavailable. Please try again in a few minutes."  
**Cause**: Render deployment failure or service crash  
**Solution**: ✅ **Immediate deployment fix**

---

## ⚡ **INSTANT FIX STEPS**

### **Step 1: Check Render Dashboard**
1. Go to [render.com](https://render.com) and log in
2. Check your `seltech-marketplace` service status
3. Look for any failed deployments or error messages

### **Step 2: Quick Deployment Fix**
If the service is down, redeploy immediately:

```bash
# Push a small change to trigger redeploy
git add .
git commit -m "Fix 502 error - redeploy"
git push origin main
```

### **Step 3: Check Build Logs**
In Render dashboard:
1. Go to your `seltech-marketplace` service
2. Click "Logs" tab
3. Look for build errors or startup failures

---

## 🔧 **COMMON 502 CAUSES & FIXES**

### **1. Build Script Failure**
**Problem**: `./scripts/render-build.sh` not found or failing

**Fix**: Create the build script:
```bash
#!/bin/bash
npm install
npm run build
```

### **2. Environment Variables Missing**
**Problem**: Required env vars not set

**Fix**: Verify these are set in Render:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

### **3. Build Command Issues**
**Problem**: Vite build failing

**Fix**: Update render.yaml build command:
```yaml
buildCommand: npm install && npm run build
```

### **4. Static Files Path Wrong**
**Problem**: Render can't find built files

**Fix**: Verify `staticPublishPath: ./dist` is correct

---

## 🚀 **EMERGENCY DEPLOYMENT**

If Render is still failing, here's a backup plan:

### **Option 1: Netlify (5 minutes)**
1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your `dist` folder
3. Update DNS to point to Netlify URL

### **Option 2: Vercel (3 minutes)**
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Deploy automatically

### **Option 3: GitHub Pages (2 minutes)**
1. Go to your GitHub repository
2. Settings → Pages
3. Deploy from `gh-pages` branch

---

## 🔍 **DEBUGGING CHECKLIST**

### **Check These in Order:**

1. **Render Service Status**
   - [ ] Service is "Live" (not "Build Failed")
   - [ ] No error messages in dashboard
   - [ ] Recent deployment succeeded

2. **Build Process**
   - [ ] `npm install` completed successfully
   - [ ] `npm run build` created `dist` folder
   - [ ] No TypeScript or ESLint errors

3. **Environment Variables**
   - [ ] All required VITE_ variables set
   - [ ] Supabase URL and key are correct
   - [ ] No missing or invalid values

4. **DNS Configuration**
   - [ ] Domain points to correct Render URL
   - [ ] SSL certificate is valid
   - [ ] No DNS propagation issues

---

## ⚡ **IMMEDIATE ACTIONS**

### **Right Now (1 minute):**
1. Check Render dashboard for error messages
2. Look at the latest deployment logs
3. Identify the specific failure point

### **Quick Fix (5 minutes):**
1. Fix any build script issues
2. Verify environment variables
3. Trigger a new deployment
4. Monitor build progress

### **Backup Plan (10 minutes):**
1. Deploy to Netlify as backup
2. Update DNS temporarily
3. Fix Render issues in parallel
4. Switch back when resolved

---

## 🎯 **MOST LIKELY FIXES**

Based on common Render issues:

### **Fix 1: Update Build Command**
In `render.yaml`:
```yaml
buildCommand: npm ci && npm run build
staticPublishPath: ./dist
```

### **Fix 2: Create Build Script**
Create `scripts/render-build.sh`:
```bash
#!/bin/bash
set -e
echo "Starting Render build..."
npm ci
npm run build
echo "Build completed successfully"
```

### **Fix 3: Environment Variables**
Ensure these are set in Render dashboard:
```
NODE_ENV=production
VITE_SUPABASE_URL=https://rtsaarapvlzzinmpjdys.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚨 **IF STILL FAILING**

### **Emergency Netlify Deploy:**
1. Run `npm run build` locally
2. Go to [netlify.com](https://netlify.com)
3. Drag `dist` folder to deploy
4. Get instant URL: `https://random-name.netlify.app`
5. Update DNS temporarily

### **Quick Vercel Deploy:**
1. Connect GitHub to Vercel
2. Import repository
3. Auto-deploy in 2 minutes
4. Get URL: `https://seltech-online.vercel.app`

---

## 🎉 **SUCCESS INDICATORS**

When fixed, you should see:
- ✅ Render service shows "Live" status
- ✅ Website loads at seltech.online
- ✅ No 502 errors
- ✅ PesaPal payments working
- ✅ All features functional

**Next Step**: Once site is back online, test the PesaPal payment integration we just implemented!

---

## 📞 **IMMEDIATE HELP**

1. **Check Render logs** for specific error messages
2. **Try manual redeploy** from Render dashboard
3. **Use backup deployment** if Render is completely down
4. **Report specific error messages** for targeted fixes

The 502 error is usually a quick fix once we identify the root cause!
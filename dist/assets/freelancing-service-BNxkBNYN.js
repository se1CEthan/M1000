import{s}from"./index-5d3XQKqN.js";class p{static async create(e){const{data:t,error:r}=await s.from("freelancer_profiles").insert([{...e,user_id:(await s.auth.getUser()).data.user?.id}]).select().single();if(r)throw r;return t}static async getById(e){const{data:t,error:r}=await s.from("freelancer_profiles").select(`
        *,
        portfolio_items(*),
        reviews:reviews!reviewee_id(*)
      `).eq("id",e).single();return r?null:t}static async getByUserId(e){const{data:t,error:r}=await s.from("freelancer_profiles").select("*").eq("user_id",e).single();return r?null:t}static async update(e,t){const{data:r,error:a}=await s.from("freelancer_profiles").update(t).eq("id",e).select().single();if(a)throw a;return r}static async search(e,t=1,r=20){let a=s.from("freelancer_profiles").select(`
        *,
        reviews:reviews!reviewee_id(rating)
      `,{count:"exact"});e.skills?.length&&(a=a.overlaps("skills",e.skills)),e.experience_level?.length&&(a=a.in("experience_level",e.experience_level)),e.hourly_rate_min&&(a=a.gte("hourly_rate",e.hourly_rate_min)),e.hourly_rate_max&&(a=a.lte("hourly_rate",e.hourly_rate_max)),e.availability?.length&&(a=a.in("availability",e.availability)),e.location&&(a=a.ilike("location",`%${e.location}%`)),e.rating_min&&(a=a.gte("rating",e.rating_min)),e.is_verified!==void 0&&(a=a.eq("is_verified",e.is_verified)),e.languages?.length&&(a=a.overlaps("languages",e.languages));const o=e.sort_by||"created_at",i=e.sort_order||"desc";a=a.order(o,{ascending:i==="asc"});const n=(t-1)*r,d=n+r-1;a=a.range(n,d);const{data:c,error:u,count:f}=await a;if(u)throw u;return{data:c||[],total:f||0,page:t,per_page:r,total_pages:Math.ceil((f||0)/r)}}static async updateOnlineStatus(e,t){const{error:r}=await s.from("freelancer_profiles").update({is_online:t,last_seen:new Date().toISOString()}).eq("id",e);if(r)throw r}static async getFeatured(e=10){const{data:t,error:r}=await s.from("freelancer_profiles").select("*").eq("is_featured",!0).order("rating",{ascending:!1}).limit(e);if(r)throw r;return t||[]}}class g{static async create(e){const{data:t,error:r}=await s.from("business_profiles").insert([{...e,user_id:(await s.auth.getUser()).data.user?.id}]).select().single();if(r)throw r;return t}static async getById(e){const{data:t,error:r}=await s.from("business_profiles").select("*").eq("id",e).single();return r?null:t}static async getByUserId(e){const{data:t,error:r}=await s.from("business_profiles").select("*").eq("user_id",e).single();return r?null:t}static async update(e,t){const{data:r,error:a}=await s.from("business_profiles").update(t).eq("id",e).select().single();if(a)throw a;return r}}class y{static async create(e){const t=(await s.auth.getUser()).data.user;if(!t)throw new Error("User not authenticated");const r=await g.getByUserId(t.id);if(!r)throw new Error("Business profile not found");const{data:a,error:o}=await s.from("projects").insert([{...e,business_id:r.id}]).select(`
        *,
        business:business_profiles(*),
        category:project_categories(*)
      `).single();if(o)throw o;return a}static async getById(e){const{data:t,error:r}=await s.from("projects").select(`
        *,
        business:business_profiles(*),
        category:project_categories(*),
        proposals:proposals(
          *,
          freelancer:freelancer_profiles(*)
        )
      `).eq("id",e).single();return r?null:t}static async search(e,t=1,r=20){let a=s.from("projects").select(`
        *,
        business:business_profiles(*),
        category:project_categories(*)
      `,{count:"exact"}).eq("status","open");e.category_id&&(a=a.eq("category_id",e.category_id)),e.skills_required?.length&&(a=a.overlaps("skills_required",e.skills_required)),e.budget_type&&(a=a.eq("budget_type",e.budget_type)),e.budget_min&&(a=a.gte("budget_min",e.budget_min)),e.budget_max&&(a=a.lte("budget_max",e.budget_max)),e.experience_level?.length&&(a=a.in("experience_level",e.experience_level)),e.project_type?.length&&(a=a.in("project_type",e.project_type)),e.remote_ok!==void 0&&(a=a.eq("remote_ok",e.remote_ok)),e.location&&(a=a.ilike("location_required",`%${e.location}%`));const o=e.sort_by||"created_at",i=e.sort_order||"desc";a=a.order(o,{ascending:i==="asc"});const n=(t-1)*r,d=n+r-1;a=a.range(n,d);const{data:c,error:u,count:f}=await a;if(u)throw u;return{data:c||[],total:f||0,page:t,per_page:r,total_pages:Math.ceil((f||0)/r)}}static async update(e,t){const{data:r,error:a}=await s.from("projects").update(t).eq("id",e).select(`
        *,
        business:business_profiles(*),
        category:project_categories(*)
      `).single();if(a)throw a;return r}static async delete(e){const{error:t}=await s.from("projects").delete().eq("id",e);if(t)throw t}static async incrementViews(e){const{error:t}=await s.from("projects").update({views_count:s.sql`views_count + 1`}).eq("id",e);if(t)throw t}static async getByBusinessId(e){const{data:t,error:r}=await s.from("projects").select(`
        *,
        category:project_categories(*)
      `).eq("business_id",e).order("created_at",{ascending:!1});if(r)throw r;return t||[]}static async getFeatured(e=10){const{data:t,error:r}=await s.from("projects").select(`
        *,
        business:business_profiles(*),
        category:project_categories(*)
      `).eq("featured",!0).eq("status","open").order("created_at",{ascending:!1}).limit(e);if(r)throw r;return t||[]}}class _{static async create(e,t){const r=(await s.auth.getUser()).data.user;if(!r)throw new Error("User not authenticated");const a=await p.getByUserId(r.id);if(!a)throw new Error("Freelancer profile not found");const{data:o,error:i}=await s.from("proposals").insert([{...t,project_id:e,freelancer_id:a.id}]).select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `).single();if(i)throw i;return o}static async getById(e){const{data:t,error:r}=await s.from("proposals").select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `).eq("id",e).single();return r?null:t}static async getByProjectId(e){const{data:t,error:r}=await s.from("proposals").select(`
        *,
        freelancer:freelancer_profiles(*)
      `).eq("project_id",e).order("created_at",{ascending:!1});if(r)throw r;return t||[]}static async getByFreelancerId(e){const{data:t,error:r}=await s.from("proposals").select(`
        *,
        project:projects(
          *,
          business:business_profiles(*)
        )
      `).eq("freelancer_id",e).order("created_at",{ascending:!1});if(r)throw r;return t||[]}static async update(e,t){const{data:r,error:a}=await s.from("proposals").update(t).eq("id",e).select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `).single();if(a)throw a;return r}static async updateStatus(e,t){const{data:r,error:a}=await s.from("proposals").update({status:t}).eq("id",e).select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `).single();if(a)throw a;return r}static async delete(e){const{error:t}=await s.from("proposals").delete().eq("id",e);if(t)throw t}}class m{static async create(e){const t=await _.getById(e);if(!t)throw new Error("Proposal not found");const{data:r,error:a}=await s.from("contracts").insert([{project_id:t.project_id,freelancer_id:t.freelancer_id,business_id:t.project?.business_id,proposal_id:e,title:t.project?.title||"",description:t.project?.description||"",contract_type:t.project?.budget_type||"fixed",total_amount:t.proposed_budget,hourly_rate:t.proposed_hourly_rate,estimated_hours:t.estimated_hours,milestones:t.milestones}]).select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*),
        business:business_profiles(*)
      `).single();if(a)throw a;return await _.updateStatus(e,"accepted"),await s.from("projects").update({status:"in_progress"}).eq("id",t.project_id),r}static async getById(e){const{data:t,error:r}=await s.from("contracts").select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*),
        business:business_profiles(*),
        escrow_payments(*),
        time_entries(*)
      `).eq("id",e).single();return r?null:t}static async getByFreelancerId(e){const{data:t,error:r}=await s.from("contracts").select(`
        *,
        project:projects(*),
        business:business_profiles(*)
      `).eq("freelancer_id",e).order("created_at",{ascending:!1});if(r)throw r;return t||[]}static async getByBusinessId(e){const{data:t,error:r}=await s.from("contracts").select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*)
      `).eq("business_id",e).order("created_at",{ascending:!1});if(r)throw r;return t||[]}static async updateStatus(e,t){const{data:r,error:a}=await s.from("contracts").update({status:t}).eq("id",e).select(`
        *,
        project:projects(*),
        freelancer:freelancer_profiles(*),
        business:business_profiles(*)
      `).single();if(a)throw a;return r}}class h{static async createConversation(e,t,r,a){const{data:o,error:i}=await s.from("conversations").insert([{participants:e,subject:t,project_id:r,contract_id:a}]).select().single();if(i)throw i;return o}static async sendMessage(e,t,r=[]){const a=(await s.auth.getUser()).data.user;if(!a)throw new Error("User not authenticated");const{data:o,error:i}=await s.from("messages").insert([{conversation_id:e,sender_id:a.id,content:t,attachments:r}]).select().single();if(i)throw i;return await s.from("conversations").update({last_message_at:new Date().toISOString()}).eq("id",e),o}static async getConversations(e){const{data:t,error:r}=await s.from("conversations").select(`
        *,
        messages(
          *,
          sender:auth.users(*)
        )
      `).contains("participants",[e]).order("last_message_at",{ascending:!1});if(r)throw r;return t||[]}static async getMessages(e){const{data:t,error:r}=await s.from("messages").select(`
        *,
        sender:auth.users(*)
      `).eq("conversation_id",e).order("created_at",{ascending:!0});if(r)throw r;return t||[]}static async markAsRead(e){const{error:t}=await s.from("messages").update({is_read:!0,read_at:new Date().toISOString()}).eq("id",e);if(t)throw t}}class v{static async create(e,t,r,a,o={}){const i=(await s.auth.getUser()).data.user;if(!i)throw new Error("User not authenticated");const n=await p.getByUserId(i.id);await g.getByUserId(i.id);const d=n?"freelancer":"business",{data:c,error:u}=await s.from("reviews").insert([{contract_id:e,reviewer_id:i.id,reviewee_id:t,reviewer_type:d,rating:r,comment:a,skills_rating:o}]).select().single();if(u)throw u;return await this.updateProfileRating(t),c}static async getByRevieweeId(e){const{data:t,error:r}=await s.from("reviews").select(`
        *,
        reviewer:auth.users(*)
      `).eq("reviewee_id",e).eq("is_public",!0).order("created_at",{ascending:!1});if(r)throw r;return t||[]}static async updateProfileRating(e){const{data:t}=await s.from("reviews").select("rating").eq("reviewee_id",e);if(!t||t.length===0)return;const r=t.reduce((o,i)=>o+i.rating,0)/t.length,a=t.length;await s.from("freelancer_profiles").update({rating:r,rating_count:a}).eq("user_id",e),await s.from("business_profiles").update({avg_rating:r,rating_count:a}).eq("user_id",e)}}class j{static async getAll(){const{data:e,error:t}=await s.from("project_categories").select("*").eq("is_active",!0).order("sort_order");if(t)throw t;return e||[]}static async getById(e){const{data:t,error:r}=await s.from("project_categories").select("*").eq("id",e).single();return r?null:t}}class q{static async getFreelancerStats(e){const[t,r,a]=await Promise.all([s.from("contracts").select("status, total_amount").eq("freelancer_id",e),s.from("proposals").select("status").eq("freelancer_id",e),s.from("freelancer_profiles").select("rating, total_earnings").eq("id",e).single()]),o=t.data?.filter(c=>c.status==="active").length||0,i=r.data?.filter(c=>c.status==="pending").length||0,n=a.data?.total_earnings||0,d=a.data?.rating||0;return{active_contracts:o,pending_proposals:i,total_earnings:n,avg_rating:d,profile_views:0}}static async getBusinessStats(e){const[t,r,a]=await Promise.all([s.from("projects").select("status").eq("business_id",e),s.from("contracts").select("status, total_amount").eq("business_id",e),s.from("business_profiles").select("total_spent, avg_rating").eq("id",e).single()]),o=t.data?.filter(c=>c.status==="open"||c.status==="in_progress").length||0,i=a.data?.total_spent||0,n=r.data?.filter(c=>c.status!=="cancelled").length||0,d=a.data?.avg_rating||0;return{active_projects:o,total_spent:i,hired_freelancers:n,avg_project_rating:d}}}class b{static async create(e,t,r,a,o={}){const{data:i,error:n}=await s.from("notifications").insert([{user_id:e,type:t,title:r,message:a,data:o}]).select().single();if(n)throw n;return i}static async getByUserId(e,t=50){const{data:r,error:a}=await s.from("notifications").select("*").eq("user_id",e).order("created_at",{ascending:!1}).limit(t);if(a)throw a;return r||[]}static async markAsRead(e){const{error:t}=await s.from("notifications").update({is_read:!0,read_at:new Date().toISOString()}).eq("id",e);if(t)throw t}static async markAllAsRead(e){const{error:t}=await s.from("notifications").update({is_read:!0,read_at:new Date().toISOString()}).eq("user_id",e).eq("is_read",!1);if(t)throw t}}export{g as B,m as C,q as D,p as F,h as M,b as N,y as P,v as R,_ as a,j as b};

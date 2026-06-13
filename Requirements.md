LifePlate MVP - Product Requirements Document
Product Name
LifePlate
Tagline
Know what you're feeding your future.
Vision
LifePlate is an AI-powered nutrition journaling app that allows users to build a lifelong health record simply by taking photos of their meals.
The goal is not calorie counting.
The goal is to create awareness and long-term visibility into eating habits by transforming meal photos into meaningful health insights.
MVP Goals
The MVP should answer one question:
Will users consistently take photos of their meals?
Do not optimize for perfect nutrition accuracy.
Optimize for speed and habit formation.
A meal should be logged in under 5 seconds.
Tech Stack
Frontend:
React Native
Expo
TypeScript
Backend:
Node.js
Fastify
TypeScript
Database:
PostgreSQL
Auth:
Supabase Auth
Storage:
Supabase Storage
AI:
OpenAI Vision API
Deployment:
Railway or Render
Analytics:
PostHog
Core User Flow
First Launch
User sees:
Welcome to LifePlate
Take photos of your meals.
Build your health story.
Understand what you're feeding your future.
Buttons:
Get Started
Sign In
Onboarding
Ask:
What is your goal?
Options:
Better health
Weight management
Increase protein
Improve nutrition awareness
Track symptoms
General wellbeing
Store goal.
Home Screen
Large camera button.
Text:
"What are you eating?"
Actions:
Take Photo
Upload Photo
Meal Logging Flow
User takes photo.
Send image to backend.
Backend sends image to OpenAI Vision.
Expected response:
{
  "mealName": "Chicken Rice Bowl",
  "foods": [
    "Chicken Breast",
    "Rice",
    "Broccoli"
  ],
  "estimatedCalories": 650,
  "protein": 45,
  "carbs": 55,
  "fat": 18,
  "confidence": 0.82
}
Display result.
User taps:
Confirm
Edit
Store meal.
Screens
Home
Show:
Today's meals
Quick add button
Daily streak
Timeline
Chronological feed.
Example:
Breakfast
8:15 AM
[Photo]
Eggs on Toast
Lunch
12:20 PM
[Photo]
Chicken Rice Bowl
Dinner
6:45 PM
[Photo]
Steak and Vegetables
Insights
This Week
Meals Logged: 19
Vegetables Consumed: 12
Protein Average: 94g/day
Most Common Food:
Chicken
Home Cooked:
82%
Takeaway:
18%
Profile
Name
Goal
Meals Logged
Current Streak
Longest Streak
Export Data
Database Schema
Users
id UUID PRIMARY KEY
email TEXT
name TEXT
goal TEXT
created_at TIMESTAMP
Meals
id UUID PRIMARY KEY
user_id UUID
meal_type TEXT
meal_name TEXT
image_url TEXT
created_at TIMESTAMP
MealAnalysis
id UUID PRIMARY KEY
meal_id UUID
calories INTEGER
protein INTEGER
carbs INTEGER
fat INTEGER
confidence DECIMAL
raw_ai_response JSONB
Foods
id UUID PRIMARY KEY
meal_id UUID
food_name TEXT
API Endpoints
POST
/api/meals/upload
Upload image.
Returns meal analysis.
POST
/api/meals/confirm
Persist meal.
GET
/api/meals
Fetch timeline.
GET
/api/insights
Fetch analytics.
OpenAI Prompt
When analyzing meal photos:
You are a nutrition assistant.
Return JSON only.
Identify:
meal name
foods present
estimated calories
estimated protein
estimated carbs
estimated fats
Return confidence score.
Do not return markdown.
Output valid JSON.
Future Features (NOT MVP)
Phase 2
Symptom tracking
Weight tracking
Water intake
Phase 3
Blood test uploads
GP reports
PDF exports
Phase 4
Wearables integration
Apple Health
Google Health Connect
Phase 5
Dietitian dashboard
Family accounts
AI health coach
Design Direction
Style:
Apple Health
Calm
Minimal
Premium
Primary Colors:
White
Deep Green
Charcoal
Feel:
Trustworthy
Scientific
Human
Avoid:
Fitness bro aesthetics
Aggressive calorie tracking
Weight loss messaging
LifePlate is about awareness and ownership, not dieting.
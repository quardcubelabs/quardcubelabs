@echo off
REM Script to run the blogs table creation SQL file
REM Make sure you have your Supabase credentials configured

echo Creating blogs table and inserting data...

REM Option 1: Using psql (if you have direct database access)
REM psql "%POSTGRES_URL%" -f db/create_blogs_table.sql

echo.
echo To run this SQL file, you can:
echo 1. Copy the contents of db/create_blogs_table.sql
echo 2. Paste it into your Supabase SQL Editor at: https://supabase.com/dashboard/project/YOUR_PROJECT/sql
echo 3. Click 'Run' to execute the script
echo.
echo Or use psql command:
echo psql "%%POSTGRES_URL%%" -f db/create_blogs_table.sql
echo.
echo SQL file location: db/create_blogs_table.sql

pause

# Test User Management Functionality

## Steps to Test the Fix

### 1. Apply the Database Migration
Run the SQL migration file to fix the RLS policies:
```sql
-- Run: complete_user_management_fix.sql
```

### 2. Deploy the Updated Edge Functions
The create-user function has been updated to properly create profile records.

### 3. Test Scenarios

#### Test 1: Admin Can View All Users
1. Login as an admin user
2. Navigate to "Gestione Utenti" (User Management)
3. Verify that all users are displayed in the list
4. Check that user details (name, email, role, creation date) are shown correctly

#### Test 2: Admin Can Create New Users
1. In the User Management page, fill out the "Nuovo Utente" form:
   - Email: test@example.com
   - Nome Completo: Test User
   - Password: testpassword123
   - Ruolo: Commerciale
2. Click "Crea Utente"
3. Verify success notification appears
4. Verify the new user appears in the users list
5. Verify the new user can login with the provided credentials

#### Test 3: Admin Can Edit Users
1. Click the edit button (pencil icon) next to any user
2. Modify the user's name and/or role
3. Click "Salva Modifiche"
4. Verify the changes are saved and reflected in the list

#### Test 4: Admin Can Delete Users
1. Click the delete button (trash icon) next to a user (not yourself)
2. Confirm the deletion in the dialog
3. Verify the user is removed from the list
4. Verify the user can no longer login

#### Test 5: Non-Admin Users Cannot Access
1. Login as a non-admin user (commerciale or lettore)
2. Try to navigate to /user-management
3. Verify access is denied with appropriate error message

### 4. Expected Results

After applying the fix:
- ✅ Admin users can see all users in the management page
- ✅ Admin users can create new users successfully
- ✅ Admin users can edit user details and roles
- ✅ Admin users can delete users
- ✅ Non-admin users are blocked from accessing user management
- ✅ New users are created with proper profile records
- ✅ All user operations work without RLS permission errors

### 5. Troubleshooting

If issues persist:

1. **Check RLS Policies**: Verify the policies were created correctly
2. **Check Edge Functions**: Ensure the updated functions are deployed
3. **Check Console Logs**: Look for any JavaScript errors in the browser console
4. **Check Network Tab**: Verify API calls are successful
5. **Check Database**: Verify profiles exist for all users

### 6. Database Verification Queries

Run these queries to verify the fix:

```sql
-- Check if all auth users have profiles
SELECT 
  'Missing profiles' as issue,
  count(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Check admin users
SELECT 
  'Admin users' as info,
  count(*) as count
FROM public.profiles 
WHERE role = 'admin';

-- Check all profiles
SELECT 
  'Total profiles' as info,
  count(*) as count
FROM public.profiles;
```

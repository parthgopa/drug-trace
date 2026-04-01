# Testing Owner Filter - Debug Guide

## **ISSUE**
Owner filtering not showing data for selected owner.

## **DEBUG STEPS**

### **1. Check Backend Logs**

After selecting an owner and navigating to Drugs/Reports/Scans pages, check your backend console for debug messages:

```
DEBUG - get_all_drugs: owner_id=<ID>, page=1, limit=50
DEBUG - Filtered drugs count: <COUNT>
```

**What to look for:**
- Is `owner_id` being received? (should be the owner's `_id`)
- What is the filtered count? (0 means no drugs for that owner)

### **2. Check Owner ID Format**

The owner `_id` should match the `manufacturer_id` in drugs collection.

**In MongoDB, check:**
```javascript
// Find an owner
db.users.findOne({role: 'owner'})
// Note the _id

// Check if any drugs have this manufacturer_id
db.drugs.find({manufacturer_id: "<owner_id>"})
```

### **3. Verify Data Exists**

**Check if owner has drugs:**
```javascript
// In MongoDB
db.drugs.find({manufacturer_id: "<owner_id>"}).count()
```

If count is 0, the owner has no drugs in the system.

### **4. Check Frontend Console**

Open browser DevTools Console and Network tab:

**Console should show:**
```javascript
{selectedOwner: {_id: "...", name: "...", ...}}
```

**Network tab should show:**
```
GET /admin/drugs?page=1&limit=50&owner_id=<ID>
```

### **5. Test Directly**

**Using curl or Postman:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8001/admin/drugs?owner_id=<OWNER_ID>&page=1&limit=50"
```

## **COMMON ISSUES**

### **Issue 1: No drugs for owner**
**Symptom:** `DEBUG - Filtered drugs count: 0`

**Solution:** Owner needs to create drugs first. Drugs are created by manufacturers (owners).

### **Issue 2: owner_id is null**
**Symptom:** `DEBUG - get_all_drugs: owner_id=None`

**Solution:** 
- Check if owner is selected in frontend
- Check browser console for `selectedOwner`
- Verify API call includes `owner_id` parameter

### **Issue 3: ID mismatch**
**Symptom:** Drugs exist but count is 0

**Solution:**
- Verify `drugs.manufacturer_id` matches `users._id` (for owner)
- Check if IDs are strings vs ObjectId

### **Issue 4: Wrong field name**
**Symptom:** Backend error

**Solution:**
- Drugs use `manufacturer_id` field
- Scans use `drug_info.manufacturer_id` field
- Reports link via serial_number

## **QUICK FIX**

If owner has no drugs, create a test drug:

**In MongoDB:**
```javascript
db.drugs.insertOne({
  drug_name: "Test Drug",
  manufacturer: "Test Manufacturer",
  manufacturer_id: "<OWNER_ID>",  // Use actual owner _id
  batch_number: "TEST001",
  serial_number: "TEST-001",
  status: "active",
  created_at: new Date(),
  updated_at: new Date(),
  expiry_date: "2027-12-31",
  manufacturing_date: "2026-01-01"
})
```

Then refresh the Drugs page with owner selected.

## **EXPECTED BEHAVIOR**

1. Select owner on Owners page
2. Navigate to Drugs page
3. Backend log shows: `DEBUG - get_all_drugs: owner_id=<ID>`
4. Backend log shows: `DEBUG - Filtered drugs count: <N>` (N > 0)
5. Frontend shows only drugs from that owner
6. Blue badge shows: "Filtered by owner: <Name>"

## **NEXT STEPS**

1. **Check backend logs** - Look for DEBUG messages
2. **Verify owner has data** - Check MongoDB
3. **Check browser console** - Verify selectedOwner
4. **Check network tab** - Verify owner_id parameter
5. **Report findings** - Share what you see in logs

// =====================================================================
// DEPARTMENT REPORT SCHEMAS
// =====================================================================
// Each department is described here as DATA, not hardcoded HTML.
// The rendering engine (in app.html) reads whichever schema matches the
// signed-in department head and builds the form automatically.
//
// TO ADD A NEW DEPARTMENT LATER: replace its `comingSoon: true` stub below
// with a full definition in the same shape as FARM_SCHEMA. No other file
// needs to change — that's the whole point of this design.
// =====================================================================

// ---- small helpers used by dashboard calculations ----
const sum = (rows, key) => (rows || []).reduce((t, r) => t + (Number(r[key]) || 0), 0);
const count = (rows) => (rows || []).length;
const countWhere = (rows, pred) => (rows || []).filter(pred).length;

// ---- field type reference ----
// text        -> single-line text input
// textarea    -> multi-line text input
// number      -> numeric input
// date        -> date picker
// select      -> dropdown, needs `options: []`
// yesno       -> Yes/No toggle; can reveal a follow-up field via `revealField`
// table       -> repeatable table; needs `columns: []`, each column has
//                { key, label, type: 'text'|'number'|'select'|'date', options? }
//                a column can have `auto: (row) => value` to self-calculate (e.g. totals)
// declaration -> name / signature / date block (rendered specially)

const FARM_SCHEMA = {
  slug: 'farm',
  title: 'Farm Department Monthly Report',
  dashboard: [
    { label: 'Total Harvest', icon: '🌾', compute: (d) => sum(d.crops, 'quantityHarvested') },
    { label: 'Total Livestock (Closing)', icon: '🐄', compute: (d) => sum(d.livestock, 'closingStock') },
    { label: 'Total Poultry (Closing)', icon: '🐔', compute: (d) => sum(d.poultry, 'closingStock') },
    { label: 'Produce Sold (UGX)', icon: '🛒', compute: (d) => sum((d.distribution || []).filter(r => r.transactionType === 'Sale'), 'totalAmount') },
    { label: 'Donations Received', icon: '🎁', compute: (d) => count(d.donations) },
    { label: 'Farm Income (UGX)', icon: '💵', compute: (d) => sum(d.income, 'amount') },
    { label: 'Farm Expenses (UGX)', icon: '💸', compute: (d) => sum(d.expenses, 'amount') },
    { label: 'Net Farm Position (UGX)', icon: '📊', compute: (d) => sum(d.income, 'amount') - sum(d.expenses, 'amount') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'farmManager', label: 'Farm Manager / Officer', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall Farm Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: farm production, major achievements, sales, internal supplies, livestock performance, challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'crops', title: '3. Crop Production',
      fields: [
        {
          key: 'crops', type: 'table', label: 'Crop Production',
          columns: [
            { key: 'crop', label: 'Crop', type: 'text' },
            { key: 'garden', label: 'Garden/Plot', type: 'text' },
            { key: 'areaPlanted', label: 'Area Planted', type: 'text' },
            { key: 'plantingDate', label: 'Planting Date', type: 'date' },
            { key: 'expectedHarvest', label: 'Expected Harvest', type: 'date' },
            { key: 'quantityHarvested', label: 'Quantity Harvested', type: 'number' },
            { key: 'unit', label: 'Unit', type: 'select', options: ['Kg', 'Bags', 'Bundles', 'Crates', 'Other'] },
            { key: 'status', label: 'Status', type: 'select', options: ['Growing', 'Harvested', 'Damaged', 'Failed'] },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'quantityHarvested', label: 'Total Harvest' }],
        },
      ],
    },
    {
      id: 'livestock', title: '4. Livestock Management',
      fields: [
        {
          key: 'livestock', type: 'table', label: 'Livestock Management',
          columns: [
            { key: 'animalType', label: 'Animal Type', type: 'select', options: ['Cattle', 'Goats', 'Sheep', 'Pigs', 'Rabbits', 'Other'] },
            { key: 'breed', label: 'Breed', type: 'text' },
            { key: 'opening', label: 'Opening Stock', type: 'number' },
            { key: 'births', label: 'Births', type: 'number' },
            { key: 'purchases', label: 'Purchases', type: 'number' },
            { key: 'donationsReceived', label: 'Donations Received', type: 'number' },
            { key: 'deaths', label: 'Deaths', type: 'number' },
            { key: 'sales', label: 'Sales', type: 'number' },
            { key: 'slaughtered', label: 'Slaughtered', type: 'number' },
            { key: 'internalUse', label: 'Internal Use', type: 'number' },
            {
              key: 'closingStock', label: 'Closing Stock', type: 'number', readOnly: true,
              auto: (r) => (Number(r.opening) || 0) + (Number(r.births) || 0) + (Number(r.purchases) || 0) + (Number(r.donationsReceived) || 0)
                - (Number(r.deaths) || 0) - (Number(r.sales) || 0) - (Number(r.slaughtered) || 0) - (Number(r.internalUse) || 0),
            },
          ],
        },
      ],
    },
    {
      id: 'poultry', title: '5. Poultry Management',
      fields: [
        {
          key: 'poultry', type: 'table', label: 'Poultry Management',
          columns: [
            { key: 'birdType', label: 'Bird Type', type: 'text' },
            { key: 'opening', label: 'Opening Stock', type: 'number' },
            { key: 'chicksPurchased', label: 'Chicks Purchased', type: 'number' },
            { key: 'donationsReceived', label: 'Donations Received', type: 'number' },
            { key: 'deaths', label: 'Deaths', type: 'number' },
            { key: 'birdsSold', label: 'Birds Sold', type: 'number' },
            { key: 'birdsConsumed', label: 'Birds Consumed Internally', type: 'number' },
            {
              key: 'closingStock', label: 'Closing Stock', type: 'number', readOnly: true,
              auto: (r) => (Number(r.opening) || 0) + (Number(r.chicksPurchased) || 0) + (Number(r.donationsReceived) || 0)
                - (Number(r.deaths) || 0) - (Number(r.birdsSold) || 0) - (Number(r.birdsConsumed) || 0),
            },
            { key: 'eggProduction', label: 'Egg Production', type: 'number' },
            { key: 'eggsSold', label: 'Eggs Sold', type: 'number' },
            { key: 'eggsUsed', label: 'Eggs Used Internally', type: 'number' },
            { key: 'eggsDonated', label: 'Eggs Donated', type: 'number' },
          ],
        },
      ],
    },
    {
      id: 'distribution', title: '6. Produce Distribution & Sales',
      fields: [
        {
          key: 'distribution', type: 'table', label: 'Produce Distribution & Sales',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'produce', label: 'Produce', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'unit', label: 'Unit', type: 'text' },
            { key: 'transactionType', label: 'Transaction Type', type: 'select', options: ['Internal Supply', 'Sale', 'Donation'] },
            { key: 'recipientType', label: 'Recipient Type', type: 'select', options: ['Sonrise Primary School', 'Children\'s Home', 'Nursery School', 'Guest House', 'Administration', 'Kitchen', 'Staff', 'Community Beneficiary', 'External Customer', 'Other'] },
            { key: 'recipientName', label: 'Recipient Name (if External/Other)', type: 'text', showIf: (r) => r.recipientType === 'External Customer' || r.recipientType === 'Other' },
            { key: 'sellingPrice', label: 'Selling Price per Unit', type: 'number', showIf: (r) => r.transactionType === 'Sale' },
            {
              key: 'totalAmount', label: 'Total Amount', type: 'number', readOnly: true,
              auto: (r) => r.transactionType === 'Sale' ? (Number(r.quantity) || 0) * (Number(r.sellingPrice) || 0) : 0,
            },
            { key: 'purpose', label: 'Purpose/Remarks', type: 'text' },
          ],
          totals: [{ column: 'totalAmount', label: 'Total Income From Sales' }],
        },
      ],
    },
    {
      id: 'purchases', title: '7. Farm Purchases',
      fields: [
        {
          key: 'purchases', type: 'table', label: 'Farm Purchases',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'item', label: 'Item Purchased', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Seeds', 'Fertilizer', 'Animal Feed', 'Veterinary Drugs', 'Fuel', 'Farm Equipment', 'Building Materials', 'Chemicals', 'Other'] },
            { key: 'supplier', label: 'Supplier', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'unitCost', label: 'Unit Cost', type: 'number' },
            { key: 'totalCost', label: 'Total Cost', type: 'number', readOnly: true, auto: (r) => (Number(r.quantity) || 0) * (Number(r.unitCost) || 0) },
            { key: 'fundingSource', label: 'Funding Source', type: 'select', options: ['Farm Income', 'Ministry', 'Donation', 'Grant', 'Other'] },
          ],
          totals: [{ column: 'totalCost', label: 'Total Purchases' }],
        },
      ],
    },
    {
      id: 'donations', title: '8. Donations Received',
      fields: [
        {
          key: 'donations', type: 'table', label: 'Donations Received',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'donor', label: 'Donor', type: 'text' },
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'estimatedValue', label: 'Estimated Value', type: 'number' },
            { key: 'purpose', label: 'Purpose', type: 'text' },
          ],
          totals: [{ column: 'estimatedValue', label: 'Total Donations Received' }],
        },
      ],
    },
    {
      id: 'labour', title: '9. Farm Labour',
      fields: [
        {
          key: 'labour', type: 'table', label: 'Farm Labour',
          columns: [
            { key: 'workerName', label: 'Worker Name', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Permanent', 'Casual', 'Volunteer'] },
            { key: 'daysWorked', label: 'Days Worked', type: 'number' },
            { key: 'activity', label: 'Activity', type: 'text' },
            { key: 'dailyRate', label: 'Daily Rate', type: 'number' },
            { key: 'totalPay', label: 'Total Pay', type: 'number', readOnly: true, auto: (r) => (Number(r.daysWorked) || 0) * (Number(r.dailyRate) || 0) },
          ],
          totals: [{ column: 'totalPay', label: 'Total Labour Cost' }],
        },
      ],
    },
    {
      id: 'equipment', title: '10. Farm Equipment & Tools',
      fields: [
        {
          key: 'equipment', type: 'table', label: 'Farm Equipment & Tools',
          columns: [
            { key: 'item', label: 'Tool/Equipment', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Broken'] },
            { key: 'inUse', label: 'Currently In Use?', type: 'yesno' },
            { key: 'needsRepair', label: 'Needs Repair?', type: 'yesno' },
            { key: 'replacementNeeded', label: 'Replacement Needed?', type: 'yesno' },
            { key: 'assignedTo', label: 'Assigned To', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'inputs', title: '11. Farm Inputs Inventory',
      fields: [
        {
          key: 'inputs', type: 'table', label: 'Farm Inputs Inventory',
          columns: [
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'opening', label: 'Opening Balance', type: 'number' },
            { key: 'purchased', label: 'Purchased', type: 'number' },
            { key: 'used', label: 'Used', type: 'number' },
            { key: 'closingBalance', label: 'Closing Balance', type: 'number', readOnly: true, auto: (r) => (Number(r.opening) || 0) + (Number(r.purchased) || 0) - (Number(r.used) || 0) },
            { key: 'reorderNeeded', label: 'Reorder Needed?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'infrastructure', title: '12. Farm Assets & Infrastructure',
      fields: [
        { key: 'condAnimalHouses', label: 'Animal Houses', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condChickenHouses', label: 'Chicken Houses', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condStores', label: 'Stores', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condWaterSystem', label: 'Water System', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condFencing', label: 'Fencing', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condMachinery', label: 'Machinery', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condIrrigation', label: 'Irrigation', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'infraComments', label: 'Additional Comments', type: 'textarea' },
      ],
    },
    {
      id: 'vet', title: '13. Animal Health & Veterinary Services',
      fields: [
        {
          key: 'vet', type: 'table', label: 'Animal Health & Veterinary Services',
          columns: [
            { key: 'animal', label: 'Animal', type: 'text' },
            { key: 'disease', label: 'Disease', type: 'text' },
            { key: 'treatment', label: 'Treatment', type: 'text' },
            { key: 'vaccination', label: 'Vaccination', type: 'text' },
            { key: 'vetOfficer', label: 'Veterinary Officer', type: 'text' },
            { key: 'outcome', label: 'Outcome', type: 'text' },
            { key: 'followUp', label: 'Follow-up', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'financial', title: '14. Financial Summary',
      fields: [
        {
          key: 'income', type: 'table', label: 'Income',
          columns: [
            { key: 'source', label: 'Source', type: 'select', options: ['Produce Sales', 'Livestock Sales', 'Egg Sales', 'Milk Sales', 'Other Income'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Income' }],
        },
        {
          key: 'expenses', type: 'table', label: 'Expenses',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Labour', 'Feeds', 'Seeds', 'Veterinary', 'Repairs', 'Fuel', 'Equipment', 'Utilities', 'Other'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Expenses' }],
        },
      ],
    },
    {
      id: 'risks', title: '15. Farm Risks & Challenges',
      fields: [
        { key: 'risks', label: 'Crop diseases, animal diseases, theft, weather, feed shortages, water problems, equipment failures, staff or financial challenges, other risks', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '16. Planned Activities Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Planting, harvesting, vaccination, construction, purchases, sales, training, community support, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '17. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Management / Finance / Procurement / Maintenance / Administration / Donors', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '18. Declaration',
      fields: [
        { key: 'declName', label: 'Farm Manager Name', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const TRANSPORT_SCHEMA = {
  slug: 'transport',
  title: 'Transport Department Monthly Report',
  dashboard: [
    { label: 'Total Fleet Assets', icon: '🚗', compute: (d) => count(d.fleetInventory) },
    { label: 'Operational Vehicles', icon: '🚙', compute: (d) => countWhere(d.fleetInventory, r => r.currentStatus === 'Operational') },
    { label: 'Vehicles Under Repair', icon: '🔧', compute: (d) => countWhere(d.fleetInventory, r => r.currentStatus === 'Under Repair') },
    { label: 'Total Fuel Used (L)', icon: '⛽', compute: (d) => sum(d.fuel, 'fuelIssued') },
    { label: 'Total Kilometres', icon: '🛣️', compute: (d) => sum(d.utilization, 'kilometresCovered') },
    { label: 'Total Transport Expenditure', icon: '💰', compute: (d) => sum(d.financials, 'amount') },
    { label: 'Repairs Completed', icon: '🧰', compute: (d) => countWhere(d.repairs, r => r.completed === 'Yes') },
    { label: 'Breakdown Incidents', icon: '⚠️', compute: (d) => countWhere(d.fleetInventory, r => r.currentStatus === 'Broken Down') },
    { label: 'Accident Incidents', icon: '🚨', compute: (d) => count(d.accidents) },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'transportOfficer', label: 'Transport Officer / Manager', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'reportingPeriod', label: 'Reporting Period', type: 'text' },
        { key: 'performance', label: 'Overall Department Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: fleet performance, major travels, major repairs, challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'fleetInventory', title: '3. Fleet Inventory',
      fields: [
        {
          key: 'fleetInventory', type: 'table', label: 'Fleet Inventory',
          columns: [
            { key: 'name', label: 'Vehicle/Equipment Name', type: 'text' },
            { key: 'regNumber', label: 'Registration Number', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Vehicle', 'Motorcycle', 'Tractor', 'Generator', 'Other'] },
            { key: 'assignedDriver', label: 'Assigned Driver', type: 'text' },
            { key: 'deptUser', label: 'Department/User', type: 'text' },
            { key: 'currentStatus', label: 'Current Status', type: 'select', options: ['Operational', 'Under Repair', 'Parked', 'Broken Down'] },
          ],
        },
      ],
    },
    {
      id: 'utilization', title: '4. Vehicle Utilization',
      fields: [
        {
          key: 'utilization', type: 'table', label: 'Vehicle Utilization',
          columns: [
            { key: 'vehicle', label: 'Vehicle', type: 'text' },
            { key: 'driver', label: 'Driver', type: 'text' },
            { key: 'numTrips', label: 'Number of Trips', type: 'number' },
            { key: 'kilometresCovered', label: 'Kilometres Covered', type: 'number' },
            { key: 'purpose', label: 'Main Purpose of Travel', type: 'text' },
            { key: 'deptsServed', label: 'Departments Served', type: 'text' },
            { key: 'daysUtilized', label: 'Days Utilized', type: 'number' },
          ],
          totals: [{ column: 'numTrips', label: 'Total Trips' }, { column: 'kilometresCovered', label: 'Total Kilometres' }],
        },
      ],
    },
    {
      id: 'fuel', title: '5. Fuel Accountability',
      fields: [
        {
          key: 'fuel', type: 'table', label: 'Fuel Accountability',
          columns: [
            { key: 'vehicle', label: 'Vehicle', type: 'text' },
            { key: 'openingBalance', label: 'Opening Fuel Balance', type: 'number' },
            { key: 'fuelPurchased', label: 'Fuel Purchased (L)', type: 'number' },
            { key: 'fuelIssued', label: 'Fuel Issued (L)', type: 'number' },
            { key: 'closingBalance', label: 'Closing Balance', type: 'number', readOnly: true, auto: (r) => (Number(r.openingBalance) || 0) + (Number(r.fuelPurchased) || 0) - (Number(r.fuelIssued) || 0) },
            { key: 'costPerLitre', label: 'Cost Per Litre', type: 'number' },
            { key: 'totalFuelCost', label: 'Total Fuel Cost', type: 'number', readOnly: true, auto: (r) => (Number(r.fuelIssued) || 0) * (Number(r.costPerLitre) || 0) },
          ],
          totals: [{ column: 'fuelPurchased', label: 'Total Fuel Purchased' }, { column: 'fuelIssued', label: 'Total Fuel Used' }, { column: 'totalFuelCost', label: 'Total Fuel Cost' }],
        },
        { key: 'abnormalFuel', label: 'Any abnormal fuel consumption?', type: 'yesno' },
        { key: 'abnormalFuelExplain', label: 'If Yes, explain', type: 'textarea' },
      ],
    },
    {
      id: 'travelLog', title: '6. Travel & Field Activity Log',
      fields: [
        {
          key: 'travelLog', type: 'table', label: 'Travel & Field Activity Log',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'vehicle', label: 'Vehicle', type: 'text' },
            { key: 'driver', label: 'Driver', type: 'text' },
            { key: 'destination', label: 'Destination', type: 'text' },
            { key: 'purpose', label: 'Purpose', type: 'text' },
            { key: 'deptServed', label: 'Department Served', type: 'text' },
            { key: 'distance', label: 'Distance Travelled', type: 'number' },
            { key: 'daysAway', label: 'Days Away', type: 'number' },
            { key: 'outcome', label: 'Outcome', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'repairs', title: '7. Repairs & Maintenance',
      fields: [
        {
          key: 'repairs', type: 'table', label: 'Repairs & Maintenance',
          columns: [
            { key: 'vehicle', label: 'Vehicle', type: 'text' },
            { key: 'serviceType', label: 'Type of Service', type: 'select', options: ['Routine Service', 'Major Repair', 'Accident Repair', 'Tyre Replacement', 'Oil Change', 'Electrical', 'Body Work', 'Other'] },
            { key: 'garage', label: 'Garage/Service Provider', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'cost', label: 'Cost', type: 'number' },
            { key: 'completed', label: 'Completed?', type: 'yesno' },
            { key: 'nextServiceDue', label: 'Next Service Due', type: 'date' },
          ],
          totals: [{ column: 'cost', label: 'Total Maintenance Cost' }],
        },
      ],
    },
    {
      id: 'spareParts', title: '8. Spare Parts & Consumables',
      fields: [
        {
          key: 'spareParts', type: 'table', label: 'Spare Parts & Consumables',
          columns: [
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'vehicle', label: 'Vehicle', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'unitCost', label: 'Unit Cost', type: 'number' },
            { key: 'totalCost', label: 'Total Cost', type: 'number', readOnly: true, auto: (r) => (Number(r.quantity) || 0) * (Number(r.unitCost) || 0) },
          ],
          totals: [{ column: 'totalCost', label: 'Total Spare Parts Cost' }],
        },
      ],
    },
    {
      id: 'accidents', title: '9. Accidents & Safety',
      fields: [
        { key: 'anyAccidents', label: 'Were there any accidents?', type: 'yesno' },
        {
          key: 'accidents', type: 'table', label: 'Accident Details (if any)',
          columns: [
            { key: 'vehicle', label: 'Vehicle', type: 'text' },
            { key: 'driver', label: 'Driver', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'cause', label: 'Cause', type: 'text' },
            { key: 'damage', label: 'Damage', type: 'text' },
            { key: 'injuries', label: 'Injuries', type: 'text' },
            { key: 'policeReport', label: 'Police Report Filed?', type: 'yesno' },
            { key: 'insuranceClaim', label: 'Insurance Claim?', type: 'yesno' },
            { key: 'correctiveAction', label: 'Corrective Action', type: 'text' },
          ],
        },
        { key: 'trafficOffences', label: 'Any traffic offences / driver disciplinary issues / near misses / lessons learned', type: 'textarea' },
      ],
    },
    {
      id: 'drivers', title: '10. Driver Management',
      fields: [
        { key: 'totalDrivers', label: 'Total Drivers', type: 'number' },
        { key: 'driverAttendance', label: 'Driver Attendance', type: 'text' },
        { key: 'driverLeave', label: 'Driver Leave', type: 'text' },
        { key: 'driverTraining', label: 'Driver Training Conducted', type: 'text' },
        { key: 'driverPerformanceIssues', label: 'Driver Performance Issues', type: 'textarea' },
        { key: 'licenseChecked', label: 'License Validity Checked?', type: 'yesno' },
        { key: 'medicalChecked', label: 'Medical Fitness Checked?', type: 'yesno' },
        { key: 'staffWelfareIssues', label: 'Staff Welfare Issues', type: 'textarea' },
      ],
    },
    {
      id: 'insurance', title: '11. Insurance & Compliance',
      fields: [
        {
          key: 'insurance', type: 'table', label: 'Insurance & Compliance',
          columns: [
            { key: 'vehicle', label: 'Vehicle', type: 'text' },
            { key: 'insuranceStatus', label: 'Insurance Status', type: 'select', options: ['Valid', 'Expired', 'Pending'] },
            { key: 'insuranceExpiry', label: 'Insurance Expiry', type: 'date' },
            { key: 'roadLicenseExpiry', label: 'Road License Expiry', type: 'date' },
            { key: 'inspectionStatus', label: 'Inspection Status', type: 'select', options: ['Valid', 'Expired', 'Pending'] },
            { key: 'nextInspectionDue', label: 'Next Inspection Due', type: 'date' },
          ],
        },
        { key: 'expiredDocs', label: 'Any expired documents?', type: 'yesno' },
        { key: 'expiredDocsExplain', label: 'If Yes, explain', type: 'textarea' },
      ],
    },
    {
      id: 'condition', title: '12. Vehicle Condition Assessment',
      fields: [
        { key: 'condEngine', label: 'Engine', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condTransmission', label: 'Transmission', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condTyres', label: 'Tyres', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condBody', label: 'Body', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condElectrical', label: 'Electrical System', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condInterior', label: 'Interior', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condBrakes', label: 'Brakes', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condSuspension', label: 'Suspension', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condLights', label: 'Lights', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condCleanliness', label: 'Cleanliness', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condComments', label: 'Comments', type: 'textarea' },
      ],
    },
    {
      id: 'challenges', title: '13. Operational Challenges',
      fields: [
        { key: 'challenges', label: 'Breakdowns, budget constraints, fuel challenges, spare parts challenges, staff challenges, road conditions, other operational risks', type: 'textarea' },
      ],
    },
    {
      id: 'financials', title: '14. Financial Summary',
      fields: [
        {
          key: 'financials', type: 'table', label: 'Expenses',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Fuel', 'Repairs', 'Routine Service', 'Spare Parts', 'Insurance', 'Licensing', 'Tyres', 'Emergency Repairs', 'Other'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Grand Total Transport Expenditure' }],
        },
      ],
    },
    {
      id: 'urgentAssets', title: '15. Assets Requiring Immediate Attention',
      fields: [
        {
          key: 'urgentAssets', type: 'table', label: 'Assets Requiring Immediate Attention',
          columns: [
            { key: 'asset', label: 'Asset', type: 'text' },
            { key: 'problem', label: 'Problem', type: 'text' },
            { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['High', 'Medium', 'Low'] },
            { key: 'recommendedAction', label: 'Recommended Action', type: 'text' },
            { key: 'estimatedCost', label: 'Estimated Cost', type: 'number' },
            { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
          ],
        },
      ],
    },
    {
      id: 'nextMonth', title: '16. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Planned services, planned repairs, vehicle renewals, expected major trips, budget needed, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '17. Department Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to management, capital purchases needed, policy recommendations, safety recommendations, cost saving suggestions', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '18. Declaration',
      fields: [
        { key: 'declName', label: 'Transport Officer Name', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const SOCIAL_WORK_SCHEMA = {
  slug: 'social_work',
  title: 'Social Work Department Monthly Report',
  dashboard: [
    { label: 'Children Under Follow-up', icon: '👧', compute: (d) => count(d.childCases) },
    { label: 'Active Cases', icon: '📂', compute: (d) => countWhere(d.childCases, r => r.currentStatus === 'Active') },
    { label: 'Cases Closed', icon: '✅', compute: (d) => countWhere(d.childCases, r => r.currentStatus === 'Closed') },
    { label: 'Home Visits', icon: '🏠', compute: (d) => countWhere(d.familyStrengthening, r => r.homeVisitConducted === 'Yes') },
    { label: 'Family Meetings', icon: '👨‍👩‍👧', compute: (d) => countWhere(d.familyStrengthening, r => r.familyMeetingHeld === 'Yes') },
    { label: 'School Visits', icon: '🏫', compute: (d) => countWhere(d.schoolMonitoring, r => r.visitConducted === 'Yes') },
    { label: 'Counseling Sessions', icon: '💬', compute: (d) => sum(d.counseling, 'sessionsConducted') },
    { label: 'Protection Cases', icon: '🛡️', compute: (d) => count(d.protectionCases) },
    { label: 'Community Activities', icon: '🤝', compute: (d) => count(d.communityEngagement) },
    { label: 'Compliance Activities', icon: '📑', compute: (d) => count(d.complianceActivities) },
    { label: 'Referrals Made', icon: '🔄', compute: (d) => Number(d.referralsMade) || 0 },
    { label: 'Department Expenditure', icon: '💰', compute: (d) => sum(d.financials, 'amount') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'socialWorker', label: 'Social Worker Name', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall Department Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: major achievements, child welfare status, community activities, compliance updates, challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'childCases', title: '3. Child Case Management',
      fields: [
        {
          key: 'childCases', type: 'table', label: 'Child Case Management',
          columns: [
            { key: 'childName', label: 'Child Name', type: 'text' },
            { key: 'childId', label: 'Child ID', type: 'text' },
            { key: 'age', label: 'Age', type: 'number' },
            { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
            { key: 'homeHouse', label: 'Home/Family House', type: 'text' },
            { key: 'schoolClass', label: 'School/Class', type: 'text' },
            { key: 'caseCategory', label: 'Case Category', type: 'select', options: ['Education', 'Protection', 'Behaviour', 'Medical', 'Family', 'Legal', 'Psychosocial', 'Reintegration', 'Other'] },
            { key: 'dateOpened', label: 'Date Opened', type: 'date' },
            { key: 'currentStatus', label: 'Current Status', type: 'select', options: ['Active', 'Monitoring', 'Closed'] },
            { key: 'interventions', label: 'Key Interventions Completed', type: 'text' },
            { key: 'progress', label: 'Progress This Month', type: 'text' },
            { key: 'challenges', label: 'Challenges', type: 'text' },
            { key: 'nextAction', label: 'Next Action', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'protection', title: '4. Child Protection & Safeguarding',
      fields: [
        { key: 'anySafeguarding', label: 'Were any safeguarding concerns identified?', type: 'yesno' },
        {
          key: 'protectionCases', type: 'table', label: 'Safeguarding Concerns (if any)',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'natureOfConcern', label: 'Nature of Concern', type: 'text' },
            { key: 'dateIdentified', label: 'Date Identified', type: 'date' },
            { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['Low', 'Medium', 'High'] },
            { key: 'immediateAction', label: 'Immediate Action Taken', type: 'text' },
            { key: 'personsNotified', label: 'Persons Notified', type: 'text' },
            { key: 'referralMade', label: 'Referral Made?', type: 'yesno' },
            { key: 'currentStatus', label: 'Current Status', type: 'text' },
            { key: 'followUpRequired', label: 'Follow-up Required?', type: 'yesno' },
          ],
        },
        { key: 'abuseCases', label: 'Abuse Cases (count)', type: 'number' },
        { key: 'neglectCases', label: 'Neglect Cases (count)', type: 'number' },
        { key: 'exploitationConcerns', label: 'Exploitation Concerns (count)', type: 'number' },
        { key: 'missingChildIncidents', label: 'Missing Child Incidents (count)', type: 'number' },
        { key: 'behaviouralConcerns', label: 'Behavioural Concerns (count)', type: 'number' },
      ],
    },
    {
      id: 'counseling', title: '5. Psychosocial Support & Counseling',
      fields: [
        {
          key: 'counseling', type: 'table', label: 'Psychosocial Support & Counseling',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'counselingType', label: 'Counseling Type', type: 'select', options: ['Individual', 'Family', 'Group'] },
            { key: 'reason', label: 'Reason', type: 'text' },
            { key: 'sessionsConducted', label: 'Sessions Conducted', type: 'number' },
            { key: 'progress', label: 'Progress', type: 'text' },
            { key: 'followUpRequired', label: 'Follow-up Required?', type: 'yesno' },
          ],
          totals: [{ column: 'sessionsConducted', label: 'Total Counseling Sessions' }],
        },
      ],
    },
    {
      id: 'family', title: '6. Family Strengthening & Reintegration',
      fields: [
        {
          key: 'familyStrengthening', type: 'table', label: 'Family Strengthening & Reintegration',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'familyTracingConducted', label: 'Family Tracing Conducted?', type: 'yesno' },
            { key: 'homeVisitConducted', label: 'Home Visit Conducted?', type: 'yesno' },
            { key: 'familyMeetingHeld', label: 'Family Meeting Held?', type: 'yesno' },
            { key: 'reintegrationAssessment', label: 'Reintegration Assessment', type: 'text' },
            { key: 'reintegrationStatus', label: 'Reintegration Status', type: 'select', options: ['Not Started', 'In Progress', 'Completed'] },
            { key: 'supportProvided', label: 'Support Provided', type: 'text' },
            { key: 'followUpDate', label: 'Follow-up Date', type: 'date' },
          ],
        },
      ],
    },
    {
      id: 'community', title: '7. Community Engagement',
      fields: [
        {
          key: 'communityEngagement', type: 'table', label: 'Community Engagement',
          columns: [
            { key: 'communityVisited', label: 'Community Visited', type: 'text' },
            { key: 'activity', label: 'Activity Conducted', type: 'text' },
            { key: 'purpose', label: 'Purpose', type: 'text' },
            { key: 'numParticipants', label: 'Number of Participants', type: 'number' },
            { key: 'leadersInvolved', label: 'Community Leaders Involved', type: 'text' },
            { key: 'outcomes', label: 'Outcomes', type: 'text' },
            { key: 'followUpRequired', label: 'Follow-up Required?', type: 'yesno' },
          ],
        },
      ],
    },
    {
      id: 'schoolMonitoring', title: '8. School Monitoring',
      fields: [
        {
          key: 'schoolMonitoring', type: 'table', label: 'School Monitoring',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'school', label: 'School', type: 'text' },
            { key: 'visitConducted', label: 'Visit Conducted?', type: 'yesno' },
            { key: 'academicProgress', label: 'Academic Progress', type: 'text' },
            { key: 'attendance', label: 'Attendance', type: 'text' },
            { key: 'behaviour', label: 'Behaviour', type: 'text' },
            { key: 'teacherComments', label: 'Teacher Comments', type: 'text' },
            { key: 'recommendations', label: 'Recommendations', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'sponsorship', title: '9. Sponsorship & Child Follow-up',
      fields: [
        {
          key: 'sponsorship', type: 'table', label: 'Sponsorship & Child Follow-up',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'sponsor', label: 'Sponsor', type: 'text' },
            { key: 'sponsorCommCompleted', label: 'Sponsor Communication Completed?', type: 'yesno' },
            { key: 'childUpdateCompleted', label: 'Child Update Completed?', type: 'yesno' },
            { key: 'photosSubmitted', label: 'Photos Submitted?', type: 'yesno' },
            { key: 'letterSubmitted', label: 'Letter Submitted?', type: 'yesno' },
            { key: 'sponsorshipConcerns', label: 'Sponsorship Concerns', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'compliance', title: '10. Compliance & Government Reporting',
      fields: [
        { key: 'childDocsUpdated', label: 'Child Documentation Updated?', type: 'yesno' },
        {
          key: 'complianceActivities', type: 'table', label: 'Compliance Activities',
          columns: [
            { key: 'activityType', label: 'Activity Type', type: 'select', options: ['Probation Officer Visit', 'MGLSD Engagement', 'District Inspection', 'Court Matter', 'Birth Registration', 'Care Order', 'Admission Order', 'Case Review', 'Licensing', 'Other'] },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'details', label: 'Details', type: 'text' },
            { key: 'outcome', label: 'Outcome', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'stakeholders', title: '11. Stakeholder Engagement',
      fields: [
        {
          key: 'stakeholders', type: 'table', label: 'Stakeholder Engagement',
          columns: [
            { key: 'organization', label: 'Organization', type: 'text' },
            { key: 'purpose', label: 'Purpose', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'outcome', label: 'Outcome', type: 'text' },
            { key: 'nextAction', label: 'Next Action', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'documentation', title: '12. Child Documentation',
      fields: [
        { key: 'completeFiles', label: 'Children With Complete Files', type: 'number' },
        { key: 'filesUpdated', label: 'Files Updated This Month', type: 'number' },
        { key: 'birthCertsObtained', label: 'Birth Certificates Obtained', type: 'number' },
        { key: 'nationalIdsProcessed', label: 'National IDs Processed', type: 'number' },
        { key: 'medicalRecordsUpdated', label: 'Medical Records Updated', type: 'number' },
        { key: 'educationRecordsUpdated', label: 'Education Records Updated', type: 'number' },
        { key: 'incompleteFiles', label: 'Incomplete Files', type: 'number' },
      ],
    },
    {
      id: 'specialNeeds', title: '13. Special Needs Follow-up',
      fields: [
        {
          key: 'specialNeeds', type: 'table', label: 'Special Needs Follow-up',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'need', label: 'Disability/Special Need', type: 'text' },
            { key: 'therapyAttended', label: 'Therapy Attended?', type: 'yesno' },
            { key: 'schoolSupport', label: 'School Support', type: 'text' },
            { key: 'medicalFollowUp', label: 'Medical Follow-up', type: 'text' },
            { key: 'familyFollowUp', label: 'Family Follow-up', type: 'text' },
            { key: 'progress', label: 'Progress', type: 'text' },
            { key: 'additionalNeeds', label: 'Additional Needs', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'childProtectionActivities', title: '14. Community Child Protection Activities',
      fields: [
        { key: 'sensitizationMeetings', label: 'Community Sensitization Meetings', type: 'number' },
        { key: 'parentingSessions', label: 'Parenting Sessions', type: 'number' },
        { key: 'childRightsAwareness', label: 'Child Rights Awareness Sessions', type: 'number' },
        { key: 'schoolSensitization', label: 'School Sensitization Sessions', type: 'number' },
        { key: 'dialogueMeetings', label: 'Community Dialogue Meetings', type: 'number' },
        { key: 'referralsReceived', label: 'Case Referrals Received', type: 'number' },
        { key: 'referralsMade', label: 'Referrals Made', type: 'number' },
      ],
    },
    {
      id: 'financials', title: '15. Financial Accountability',
      fields: [
        {
          key: 'financials', type: 'table', label: 'Expenses',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Transport', 'Home Visits', 'Community Meetings', 'Counseling Activities', 'Emergency Child Support', 'Documentation', 'Legal Expenses', 'Other'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Department Expenditure' }],
        },
      ],
    },
    {
      id: 'challenges', title: '16. Operational Challenges',
      fields: [
        { key: 'challenges', label: 'Major challenges, community challenges, family challenges, legal challenges, resource gaps, staffing challenges, high risk cases, lessons learned', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '17. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Planned home visits, family meetings, case reviews, community activities, government engagements, training needs, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '18. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Management, HR, Education Department, Medical Department, House Mothers, Finance, Community, Government', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '19. Declaration',
      fields: [
        { key: 'declName', label: 'Social Worker Name', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const SECURITY_SCHEMA = {
  slug: 'security',
  title: 'Security Department Monthly Report',
  dashboard: [
    { label: 'Total Security Officers', icon: '👮', compute: (d) => Number(d.totalSecurityStaff) || 0 },
    { label: 'Patrols Conducted', icon: '🚶', compute: (d) => count(d.patrols) },
    { label: 'Visitors Received', icon: '🚪', compute: (d) => count(d.visitors) },
    { label: 'Security Incidents', icon: '🚨', compute: (d) => count(d.incidents) },
    { label: 'Child Safety Cases', icon: '🛡️', compute: (d) => count(d.childSafetyCases) },
    { label: 'Fire Safety Inspections', icon: '🔥', compute: (d) => count(d.emergencyChecks) },
    { label: 'Assets Inspected', icon: '🏢', compute: (d) => count(d.assets) },
    { label: 'Assets Requiring Repair', icon: '🛠️', compute: (d) => countWhere(d.assets, r => r.repairsNeeded === 'Yes') },
    { label: 'Security Systems Operational', icon: '📹', compute: (d) => countWhere(d.cctv, r => r.operational === 'Yes') },
    { label: 'Department Expenditure', icon: '💰', compute: (d) => sum(d.financials, 'amount') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'headOfSecurity', label: 'Head of Security', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall Department Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: overall security situation, major incidents, patrol effectiveness, child safety observations, challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'staffing', title: '3. Security Staffing',
      fields: [
        { key: 'totalSecurityStaff', label: 'Total Security Staff', type: 'number' },
        { key: 'dayShiftOfficers', label: 'Day Shift Officers', type: 'number' },
        { key: 'nightShiftOfficers', label: 'Night Shift Officers', type: 'number' },
        { key: 'staffAttendance', label: 'Staff Attendance', type: 'text' },
        { key: 'absenteeism', label: 'Absenteeism', type: 'text' },
        { key: 'leaveTaken', label: 'Leave Taken', type: 'text' },
        { key: 'vacantPositions', label: 'Vacant Positions', type: 'number' },
        { key: 'trainingConducted', label: 'Training Conducted', type: 'text' },
        { key: 'performanceConcerns', label: 'Performance Concerns', type: 'textarea' },
        { key: 'staffComments', label: 'General Staff Comments', type: 'textarea' },
      ],
    },
    {
      id: 'patrols', title: '4. Daily Patrol Summary',
      fields: [
        {
          key: 'patrols', type: 'table', label: 'Daily Patrol Summary',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'shift', label: 'Shift', type: 'select', options: ['Day', 'Night'] },
            { key: 'patrolArea', label: 'Patrol Area', type: 'text' },
            { key: 'patrolTime', label: 'Patrol Time', type: 'text' },
            { key: 'officersOnDuty', label: 'Officer(s) on Duty', type: 'text' },
            { key: 'findings', label: 'Findings', type: 'text' },
            { key: 'actionTaken', label: 'Action Taken', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'incidents', title: '5. Security Incidents',
      fields: [
        {
          key: 'incidents', type: 'table', label: 'Security Incidents',
          columns: [
            { key: 'incidentDate', label: 'Incident Date', type: 'date' },
            { key: 'incidentTime', label: 'Incident Time', type: 'text' },
            { key: 'incidentType', label: 'Incident Type', type: 'select', options: ['Theft', 'Attempted Theft', 'Trespassing', 'Fighting', 'Child Missing', 'Visitor Misconduct', 'Property Damage', 'Fire', 'Medical Emergency', 'Accident', 'Suspicious Activity', 'Vandalism', 'Other'] },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'personsInvolved', label: 'Persons Involved', type: 'text' },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'immediateAction', label: 'Immediate Action Taken', type: 'text' },
            { key: 'reportedTo', label: 'Reported To', type: 'text' },
            { key: 'policeInvolved', label: 'Police Involved?', type: 'yesno' },
            { key: 'caseStatus', label: 'Case Status', type: 'select', options: ['Open', 'Under Investigation', 'Closed'] },
            { key: 'recommendations', label: 'Recommendations', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'visitors', title: '6. Visitor Management',
      fields: [
        {
          key: 'visitors', type: 'table', label: 'Visitor Log',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'visitorName', label: 'Visitor Name', type: 'text' },
            { key: 'visitorType', label: 'Visitor Type', type: 'select', options: ['Official', 'Contractor', 'Parent/Guardian', 'Supplier', 'Government Official', 'Volunteer', 'Church Visitor', 'Guest'] },
            { key: 'organization', label: 'Organization', type: 'text' },
            { key: 'purpose', label: 'Purpose', type: 'text' },
            { key: 'deptVisited', label: 'Department Visited', type: 'text' },
            { key: 'timeIn', label: 'Time In', type: 'text' },
            { key: 'timeOut', label: 'Time Out', type: 'text' },
            { key: 'escorted', label: 'Escorted?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'childSafety', title: '7. Child Safety & Safeguarding',
      fields: [
        { key: 'anyChildSafetyConcerns', label: 'Any child safety concerns?', type: 'yesno' },
        {
          key: 'childSafetyCases', type: 'table', label: 'Child Safety Concerns (if any)',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'concern', label: 'Concern', type: 'text' },
            { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['Low', 'Medium', 'High'] },
            { key: 'immediateAction', label: 'Immediate Action', type: 'text' },
            { key: 'reportedTo', label: 'Reported To', type: 'text' },
            { key: 'followUpRequired', label: 'Follow-up Required?', type: 'yesno' },
          ],
        },
        { key: 'childrenFoundOutside', label: 'Children Found Outside Designated Areas', type: 'number' },
        { key: 'unauthorizedChildMovement', label: 'Unauthorized Child Movement Incidents', type: 'number' },
        { key: 'visitorsInteractingWithChildren', label: 'Visitors Interacting With Children (unsupervised)', type: 'number' },
        { key: 'missingChildDrills', label: 'Missing Child Drills Conducted', type: 'number' },
        { key: 'safeguardingObservations', label: 'Safeguarding Observations', type: 'textarea' },
      ],
    },
    {
      id: 'assets', title: '8. Asset & Property Security',
      fields: [
        {
          key: 'assets', type: 'table', label: 'Asset & Property Security',
          columns: [
            { key: 'assetBuilding', label: 'Asset/Building', type: 'text' },
            { key: 'securityStatus', label: 'Security Status', type: 'text' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'anyDamage', label: 'Any Damage?', type: 'yesno' },
            { key: 'anyTheft', label: 'Any Theft?', type: 'yesno' },
            { key: 'repairsNeeded', label: 'Repairs Needed?', type: 'yesno' },
            { key: 'responsiblePerson', label: 'Responsible Person', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'gateAccess', title: '9. Gate Access Control',
      fields: [
        { key: 'deniedEntries', label: 'Denied Entries', type: 'number' },
        {
          key: 'gateAccess', type: 'table', label: 'Gate Access Log',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'vehicleReg', label: 'Vehicle Registration', type: 'text' },
            { key: 'driver', label: 'Driver', type: 'text' },
            { key: 'purpose', label: 'Purpose', type: 'text' },
            { key: 'department', label: 'Department', type: 'text' },
            { key: 'timeIn', label: 'Time In', type: 'text' },
            { key: 'timeOut', label: 'Time Out', type: 'text' },
            { key: 'authorizedBy', label: 'Authorized By', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'emergency', title: '10. Emergency Response & Fire Safety',
      fields: [
        { key: 'fireExtinguishersInspected', label: 'Fire Extinguishers Inspected?', type: 'yesno' },
        { key: 'emergencyExitsClear', label: 'Emergency Exits Clear?', type: 'yesno' },
        { key: 'fireDrillConducted', label: 'Fire Drill Conducted?', type: 'yesno' },
        { key: 'medicalEmergencyResponses', label: 'Medical Emergency Responses', type: 'number' },
        { key: 'powerOutages', label: 'Power Outages', type: 'number' },
        { key: 'emergencyEvacuations', label: 'Emergency Evacuations', type: 'number' },
        {
          key: 'emergencyChecks', type: 'table', label: 'Fire Safety & Emergency Checks',
          columns: [
            { key: 'activity', label: 'Activity', type: 'text' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'status', label: 'Status', type: 'text' },
            { key: 'correctiveAction', label: 'Corrective Action', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'lostFound', title: '11. Lost & Found Register',
      fields: [
        {
          key: 'lostFound', type: 'table', label: 'Lost & Found Register',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'foundBy', label: 'Found By', type: 'text' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'owner', label: 'Owner', type: 'text' },
            { key: 'returned', label: 'Returned?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'equipment', title: '12. Security Equipment',
      fields: [
        {
          key: 'equipment', type: 'table', label: 'Security Equipment',
          columns: [
            { key: 'equipment', label: 'Equipment', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Broken'] },
            { key: 'needsReplacement', label: 'Needs Replacement?', type: 'yesno' },
            { key: 'assignedOfficer', label: 'Assigned Officer', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'cctv', title: '13. CCTV & Security Systems',
      fields: [
        {
          key: 'cctv', type: 'table', label: 'CCTV & Security Systems',
          columns: [
            { key: 'cameraSystem', label: 'Camera/System', type: 'text' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'operational', label: 'Operational?', type: 'yesno' },
            { key: 'faultReported', label: 'Fault Reported?', type: 'yesno' },
            { key: 'repairRequired', label: 'Repair Required?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'riskAssessment', title: '14. Security Risk Assessment',
      fields: [
        { key: 'riskAssessment', label: 'Emerging risks, crime risks, child protection risks, fire risks, infrastructure risks, environmental risks, staff safety risks, community risks, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'financials', title: '15. Financial Accountability',
      fields: [
        {
          key: 'financials', type: 'table', label: 'Expenses',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Uniforms', 'Equipment Purchases', 'Equipment Repairs', 'Fuel', 'Communication Costs', 'Training', 'Emergency Response', 'Other'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Department Expenditure' }],
        },
      ],
    },
    {
      id: 'challenges', title: '16. Challenges',
      fields: [
        { key: 'challenges', label: 'Staffing challenges, equipment challenges, infrastructure challenges, community challenges, operational challenges, high-risk areas, support needed', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '17. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Security improvements, training, equipment purchases, infrastructure repairs, fire safety activities, risk reduction activities, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '18. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Management, HR, Transport Department, Maintenance Department, Administration, School, Children\'s Home, Community', type: 'textarea' },
      ],
    },
    {
      id: 'nightChecklist', title: '19. Daily Child Accountability & Night Security Checklist',
      fields: [
        { key: 'allChildrenAccounted', label: 'Were all children accounted for during evening checks?', type: 'yesno' },
        { key: 'anyChildAbsent', label: 'Any child absent from their designated home?', type: 'yesno' },
        { key: 'anyChildAbsentExplain', label: 'If Yes, explain', type: 'textarea' },
        { key: 'unauthorizedVisitorsAfterHours', label: 'Any unauthorized visitors after hours?', type: 'yesno' },
        { key: 'unauthorizedVisitorsExplain', label: 'If Yes, explain', type: 'textarea' },
        { key: 'doorsLocked', label: 'Dormitories, classrooms, gates, and offices locked?', type: 'yesno' },
        { key: 'generatorLightingFunctioning', label: 'Generator and security lighting functioning?', type: 'yesno' },
        { key: 'perimeterFenceInspected', label: 'Perimeter fence inspected?', type: 'yesno' },
        { key: 'unusualObservations', label: 'Any unusual observations during the night', type: 'textarea' },
        { key: 'actionsBeforeEndShift', label: 'Actions taken before end of shift', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '20. Declaration',
      fields: [
        { key: 'declName', label: 'Head of Security', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const MEDICAL_SCHEMA = {
  slug: 'medical',
  title: 'Sonrise Ministries Clinic Monthly Report',
  dashboard: [
    { label: 'Total Patients', icon: '🏥', compute: (d) => sum(d.attendance, 'count') },
    { label: 'Referrals Out', icon: '🔄', compute: (d) => { const r = (d.attendance || []).find(x => x.category === 'Referrals Out'); return r ? Number(r.count) || 0 : 0; } },
    { label: 'Special Needs Cases', icon: '🧩', compute: (d) => count(d.specialNeeds) },
    { label: 'Immunizations', icon: '💉', compute: (d) => Number(d.immunizations) || 0 },
    { label: 'Stock-outs', icon: '📦', compute: (d) => countWhere(d.medicines, r => (Number(r.stockOutDays) || 0) > 0) },
    { label: 'Medical Expenditure', icon: '💰', compute: (d) => sum(d.financials, 'amount') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'clinicName', label: 'Clinic Name', type: 'text' },
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'inCharge', label: 'In-Charge / Medical Officer', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'performance', label: 'Overall Clinic Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
        { key: 'execSummary', label: 'Summary of major activities, achievements, and concerns', type: 'textarea' },
      ],
    },
    {
      id: 'attendance', title: '3. Patient Attendance Summary',
      fields: [
        {
          key: 'attendance', type: 'table', label: 'Patient Attendance',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Sonrise Children', 'Community Children', 'Adults', 'Male', 'Female', 'Referrals In', 'Referrals Out', 'Admissions', 'Discharges'] },
            { key: 'count', label: 'Number', type: 'number' },
          ],
          totals: [{ column: 'count', label: 'Total Patients Attended' }],
        },
      ],
    },
    {
      id: 'clinicalServices', title: '4. Clinical Services Provided',
      fields: [
        { key: 'opdConsultations', label: 'OPD Consultations', type: 'number' },
        { key: 'minorProcedures', label: 'Minor Procedures', type: 'number' },
        { key: 'labTests', label: 'Laboratory Tests', type: 'number' },
        { key: 'hospitalVisits', label: 'Hospital Visits', type: 'number' },
        { key: 'emergencyCases', label: 'Emergency Cases', type: 'number' },
        { key: 'maternalCareVisits', label: 'Maternal Care Visits', type: 'number' },
        { key: 'immunizations', label: 'Immunizations', type: 'number' },
      ],
    },
    {
      id: 'illnesses', title: '5. Common Illnesses & Disease Trends',
      fields: [
        {
          key: 'illnesses', type: 'table', label: 'Top Illnesses Treated',
          columns: [
            { key: 'illness', label: 'Illness', type: 'text' },
            { key: 'cases', label: 'Number of Cases', type: 'number' },
          ],
          totals: [{ column: 'cases', label: 'Total Cases' }],
        },
        { key: 'anyOutbreak', label: 'Any outbreak or unusual trend?', type: 'yesno' },
        { key: 'outbreakExplain', label: 'If Yes, explain', type: 'textarea' },
      ],
    },
    {
      id: 'nutrition', title: '6. Child Health, Nutrition & Growth Monitoring',
      fields: [
        { key: 'growthMonitoringConducted', label: 'Growth Monitoring Conducted?', type: 'yesno' },
        { key: 'childrenMonitored', label: 'Number of Children Monitored', type: 'number' },
        { key: 'nutritionCases', label: 'Nutrition-related Cases', type: 'number' },
        { key: 'malnutritionCases', label: 'Malnutrition Cases Identified', type: 'number' },
        { key: 'nutritionInterventions', label: 'Interventions Provided', type: 'textarea' },
      ],
    },
    {
      id: 'specialNeeds', title: '7. Children with Special Medical & Developmental Needs',
      fields: [
        {
          key: 'specialNeeds', type: 'table', label: 'Special Needs Children',
          columns: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'age', label: 'Age', type: 'number' },
            { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
            { key: 'homeHouse', label: 'Home/Family House', type: 'text' },
            { key: 'schoolClass', label: 'School/Class/Training', type: 'text' },
            { key: 'specialNeedType', label: 'Type of Special Need', type: 'text' },
            { key: 'severity', label: 'Severity/Status', type: 'text' },
            { key: 'medication', label: 'Current Medication/Treatment', type: 'text' },
            { key: 'therapyReceived', label: 'Therapy Received', type: 'text' },
            { key: 'therapyFrequency', label: 'Therapy Frequency', type: 'text' },
            { key: 'classroomResponse', label: 'Classroom/Training Response', type: 'text' },
            { key: 'progress', label: 'Progress This Month', type: 'text' },
            { key: 'challenges', label: 'Challenges', type: 'text' },
            { key: 'referrals', label: 'Referrals/Specialist Appointments', type: 'text' },
            { key: 'followUp', label: 'Follow-up Actions Needed', type: 'text' },
            { key: 'assistiveDevices', label: 'Assistive Devices Used', type: 'text' },
          ],
        },
        { key: 'specialNeedsSummary', label: 'Overall monthly summary for special-needs support', type: 'textarea' },
      ],
    },
    {
      id: 'staffing', title: '8. Staffing & Human Resources',
      fields: [
        { key: 'totalStaff', label: 'Total Clinic Staff', type: 'number' },
        { key: 'staffingAdequate', label: 'Staffing Adequate?', type: 'yesno' },
        { key: 'absenteeismShortages', label: 'Absenteeism or Shortages', type: 'textarea' },
        { key: 'trainingsAttended', label: 'Trainings Attended', type: 'text' },
        { key: 'staffWelfare', label: 'Staff Welfare Concerns', type: 'textarea' },
      ],
    },
    {
      id: 'medicines', title: '9. Medicines & Medical Supplies',
      fields: [
        {
          key: 'medicines', type: 'table', label: 'Medicines & Supplies',
          columns: [
            { key: 'itemName', label: 'Item Name', type: 'text' },
            { key: 'opening', label: 'Opening Balance', type: 'number' },
            { key: 'received', label: 'Received', type: 'number' },
            { key: 'used', label: 'Used', type: 'number' },
            { key: 'closing', label: 'Closing Balance', type: 'number', readOnly: true, auto: (r) => (Number(r.opening) || 0) + (Number(r.received) || 0) - (Number(r.used) || 0) },
            { key: 'stockOutDays', label: 'Stock-out Days', type: 'number' },
            { key: 'expiryConcerns', label: 'Expiry Concerns', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'equipment', title: '10. Equipment & Facility Status',
      fields: [
        { key: 'equipmentCondition', label: 'Equipment Condition', type: 'text' },
        { key: 'faultyEquipment', label: 'Faulty Equipment', type: 'text' },
        { key: 'repairsNeeded', label: 'Repairs Needed', type: 'text' },
        { key: 'waterSanitation', label: 'Water and Sanitation Status', type: 'text' },
        { key: 'powerChallenges', label: 'Power/Electricity Challenges', type: 'text' },
      ],
    },
    {
      id: 'infection', title: '11. Infection Prevention & Safety',
      fields: [
        { key: 'protocolsFollowed', label: 'Protocols Followed?', type: 'yesno' },
        { key: 'handHygiene', label: 'Hand Hygiene Compliance', type: 'text' },
        { key: 'wasteManagement', label: 'Waste Management Status', type: 'text' },
        { key: 'safetyIncidents', label: 'Safety Incidents', type: 'textarea' },
      ],
    },
    {
      id: 'childProtection', title: '12. Child Protection & Referrals',
      fields: [
        { key: 'protectionConcerns', label: 'Child Protection Concerns Identified', type: 'textarea' },
        { key: 'protectionReferrals', label: 'Referrals to Social Worker, Hospital, or Counselor', type: 'textarea' },
        { key: 'protectionActions', label: 'Actions Taken', type: 'textarea' },
      ],
    },
    {
      id: 'outreach', title: '13. Community Outreach & Health Education',
      fields: [
        { key: 'healthEducationSessions', label: 'Health Education Sessions Conducted', type: 'number' },
        { key: 'outreachActivities', label: 'Outreach Activities Conducted', type: 'number' },
        { key: 'topicsCovered', label: 'Topics Covered', type: 'text' },
        { key: 'participantsReached', label: 'Number of Participants Reached', type: 'number' },
      ],
    },
    {
      id: 'financials', title: '14. Financial Summary',
      fields: [
        {
          key: 'financials', type: 'table', label: 'Expenses',
          columns: [
            { key: 'description', label: 'Description', type: 'select', options: ['Medicines Purchased', 'Laboratory Expenses', 'Hospital Referral Costs', 'Medical Equipment Repairs', 'Outreach Costs', 'Other Expenses'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Medical Expenditure' }],
        },
      ],
    },
    {
      id: 'challenges', title: '15. Key Challenges, Risks & Recommendations',
      fields: [
        { key: 'challenges', label: 'Major challenges, health risks, recommendations for management', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '16. Priorities & Plan for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Planned activities, urgent support required, targets for next month', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '17. Declaration',
      fields: [
        { key: 'declName', label: 'Name', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const SCHOOL_SCHEMA = {
  slug: 'school',
  title: 'School Department Monthly Report',
  dashboard: [
    { label: 'Total Learners', icon: '🎓', compute: (d) => sum(d.enrollment, 'boys') + sum(d.enrollment, 'girls') },
    { label: 'Boys', icon: '👦', compute: (d) => sum(d.enrollment, 'boys') },
    { label: 'Girls', icon: '👧', compute: (d) => sum(d.enrollment, 'girls') },
    { label: 'Nursery Enrollment', icon: '🏫', compute: (d) => sum(d.nursery, 'enrollment') },
    { label: 'Primary Enrollment', icon: '📚', compute: (d) => sum(d.primary, 'enrollment') },
    { label: 'Boarding Learners', icon: '🛏️', compute: (d) => Number(d.totalBoarders) || 0 },
    { label: 'Teaching Staff', icon: '👩‍🏫', compute: (d) => Number(d.teachingStaff) || 0 },
    { label: 'Sports Activities', icon: '⚽', compute: (d) => count(d.sports) },
    { label: 'Welfare Cases', icon: '❤️', compute: (d) => count(d.welfare) },
    { label: 'Discipline Cases', icon: '⚖️', compute: (d) => count(d.discipline) },
    { label: 'School Income', icon: '💰', compute: (d) => sum(d.income, 'amount') },
    { label: 'School Expenditure', icon: '💸', compute: (d) => sum(d.expenses, 'amount') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'schoolName', label: 'School Name', type: 'text' },
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'principal', label: 'Principal', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall School Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: academic performance, enrollment, staff performance, child welfare, major activities, challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'enrollment', title: '3. Learner Enrollment & Attendance',
      fields: [
        {
          key: 'enrollment', type: 'table', label: 'Enrollment & Attendance',
          columns: [
            { key: 'class', label: 'Class', type: 'text' },
            { key: 'boys', label: 'Boys Enrolled', type: 'number' },
            { key: 'girls', label: 'Girls Enrolled', type: 'number' },
            { key: 'total', label: 'Total Enrollment', type: 'number', readOnly: true, auto: (r) => (Number(r.boys) || 0) + (Number(r.girls) || 0) },
            { key: 'avgAttendance', label: 'Average Attendance', type: 'text' },
            { key: 'newAdmissions', label: 'New Admissions', type: 'number' },
            { key: 'withdrawals', label: 'Withdrawals', type: 'number' },
          ],
          totals: [{ column: 'boys', label: 'Total Boys' }, { column: 'girls', label: 'Total Girls' }, { column: 'total', label: 'Total Enrollment' }],
        },
      ],
    },
    {
      id: 'nursery', title: '4. Nursery Section',
      fields: [
        {
          key: 'nursery', type: 'table', label: 'Nursery Section (Baby, Middle, Top Class)',
          columns: [
            { key: 'class', label: 'Class', type: 'select', options: ['Baby Class', 'Middle Class', 'Top Class'] },
            { key: 'enrollment', label: 'Enrollment', type: 'number' },
            { key: 'attendance', label: 'Attendance', type: 'text' },
            { key: 'learningActivities', label: 'Learning Activities', type: 'text' },
            { key: 'milestones', label: 'Developmental Milestones', type: 'text' },
            { key: 'parentEngagement', label: 'Parent Engagement', type: 'text' },
            { key: 'challenges', label: 'Challenges', type: 'text' },
            { key: 'recommendations', label: 'Recommendations', type: 'text' },
          ],
          totals: [{ column: 'enrollment', label: 'Nursery Enrollment' }],
        },
      ],
    },
    {
      id: 'primary', title: '5. Primary Section',
      fields: [
        {
          key: 'primary', type: 'table', label: 'Primary Section',
          columns: [
            { key: 'class', label: 'Class', type: 'text' },
            { key: 'enrollment', label: 'Enrollment', type: 'number' },
            { key: 'attendance', label: 'Attendance', type: 'text' },
            { key: 'curriculumCoverage', label: 'Curriculum Coverage', type: 'text' },
            { key: 'assessmentCompleted', label: 'Continuous Assessment Completed?', type: 'yesno' },
            { key: 'classPerformance', label: 'Class Performance', type: 'text' },
            { key: 'challenges', label: 'Challenges', type: 'text' },
          ],
          totals: [{ column: 'enrollment', label: 'Primary Enrollment' }],
        },
      ],
    },
    {
      id: 'academics', title: '6. Academics Department',
      fields: [
        { key: 'syllabusCoverage', label: 'Syllabus Coverage (%)', type: 'number' },
        { key: 'testsConducted', label: 'Tests Conducted', type: 'number' },
        { key: 'examinationsConducted', label: 'Examinations Conducted', type: 'number' },
        { key: 'projectsConducted', label: 'Projects Conducted', type: 'number' },
        { key: 'readingProgrammes', label: 'Reading Programmes', type: 'text' },
        { key: 'remedialClasses', label: 'Remedial Classes', type: 'text' },
        { key: 'topPerformingClasses', label: 'Top Performing Classes', type: 'text' },
        { key: 'lowPerformingClasses', label: 'Low Performing Classes', type: 'text' },
        { key: 'schemesUpdated', label: 'Schemes of Work Updated?', type: 'yesno' },
        { key: 'lessonPlansAvailable', label: 'Lesson Plans Available?', type: 'yesno' },
        { key: 'academicChallenges', label: 'Academic Challenges', type: 'textarea' },
        { key: 'academicRecommendations', label: 'Recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'boarding', title: '7. Boarding Section',
      fields: [
        { key: 'totalBoarders', label: 'Total Boarders', type: 'number' },
        { key: 'boarderBoys', label: 'Boys', type: 'number' },
        { key: 'boarderGirls', label: 'Girls', type: 'number' },
        { key: 'boardingAttendance', label: 'Boarding Attendance', type: 'text' },
        { key: 'healthConcerns', label: 'Health Concerns', type: 'text' },
        { key: 'dormitoryInspections', label: 'Dormitory Inspections', type: 'text' },
        { key: 'mealsServed', label: 'Meals Served', type: 'text' },
        { key: 'nightRollCalls', label: 'Night Roll Calls', type: 'text' },
        { key: 'boardingDiscipline', label: 'Discipline Issues', type: 'text' },
        { key: 'boardingVisitors', label: 'Visitors', type: 'text' },
        {
          key: 'dormitories', type: 'table', label: 'Dormitory Status',
          columns: [
            { key: 'dormitory', label: 'Dormitory', type: 'text' },
            { key: 'occupancy', label: 'Occupancy', type: 'number' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'issues', label: 'Issues', type: 'text' },
            { key: 'actionTaken', label: 'Action Taken', type: 'text' },
          ],
          totals: [{ column: 'occupancy', label: 'Boarding Occupancy' }],
        },
      ],
    },
    {
      id: 'welfare', title: '8. Welfare Department',
      fields: [
        {
          key: 'welfare', type: 'table', label: 'Welfare Cases',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'concern', label: 'Concern', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Medical', 'Behaviour', 'Financial', 'Counseling', 'Family', 'Nutrition', 'Safeguarding'] },
            { key: 'actionTaken', label: 'Action Taken', type: 'text' },
            { key: 'followUp', label: 'Follow-up', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved'] },
          ],
        },
      ],
    },
    {
      id: 'sports', title: '9. Sports Department',
      fields: [
        {
          key: 'sports', type: 'table', label: 'Sports Activities',
          columns: [
            { key: 'sport', label: 'Sport', type: 'select', options: ['Football', 'Netball', 'Athletics', 'Volleyball', 'Music Dance & Drama', 'Chess', 'Other'] },
            { key: 'activity', label: 'Activity', type: 'text' },
            { key: 'classesInvolved', label: 'Classes Involved', type: 'text' },
            { key: 'participants', label: 'Participants', type: 'number' },
            { key: 'competition', label: 'Competition', type: 'text' },
            { key: 'results', label: 'Results', type: 'text' },
            { key: 'achievements', label: 'Achievements', type: 'text' },
            { key: 'challenges', label: 'Challenges', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'staffing', title: '10. Staffing & Human Resources',
      fields: [
        { key: 'teachingStaff', label: 'Teaching Staff', type: 'number' },
        { key: 'supportStaff', label: 'Support Staff', type: 'number' },
        { key: 'staffAttendance', label: 'Attendance', type: 'text' },
        { key: 'staffLeave', label: 'Leave', type: 'text' },
        { key: 'absenteeism', label: 'Absenteeism', type: 'text' },
        { key: 'trainingConducted', label: 'Training Conducted', type: 'text' },
        { key: 'performanceIssues', label: 'Performance Issues', type: 'textarea' },
        { key: 'vacantPositions', label: 'Vacant Positions', type: 'number' },
        { key: 'professionalDevelopment', label: 'Professional Development', type: 'text' },
      ],
    },
    {
      id: 'discipline', title: '11. Learner Discipline',
      fields: [
        {
          key: 'discipline', type: 'table', label: 'Discipline Cases',
          columns: [
            { key: 'class', label: 'Class', type: 'text' },
            { key: 'issue', label: 'Issue', type: 'text' },
            { key: 'actionTaken', label: 'Action Taken', type: 'text' },
            { key: 'parentsContacted', label: 'Parents Contacted?', type: 'yesno' },
            { key: 'resolved', label: 'Resolved?', type: 'yesno' },
            { key: 'recommendations', label: 'Recommendations', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'healthSafety', title: '12. Health & Safety',
      fields: [
        { key: 'medicalCases', label: 'Medical Cases', type: 'number' },
        { key: 'firstAidCases', label: 'First Aid Cases', type: 'number' },
        { key: 'hospitalReferrals', label: 'Hospital Referrals', type: 'number' },
        { key: 'fireDrillConducted', label: 'Fire Drill Conducted?', type: 'yesno' },
        { key: 'safetyInspections', label: 'Safety Inspections', type: 'text' },
        { key: 'waterAvailability', label: 'Water Availability', type: 'text' },
        { key: 'sanitation', label: 'Sanitation', type: 'text' },
        { key: 'classroomCleanliness', label: 'Classroom Cleanliness', type: 'text' },
      ],
    },
    {
      id: 'assets', title: '13. School Assets & Infrastructure',
      fields: [
        { key: 'condClassrooms', label: 'Classrooms', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condDormitories', label: 'Dormitories', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condFurniture', label: 'Furniture', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condLibrary', label: 'Library', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condIctLab', label: 'ICT Lab', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condPlayground', label: 'Playground', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condKitchen', label: 'Kitchen', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condDiningHall', label: 'Dining Hall', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condToilets', label: 'Toilets', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condWaterSystem', label: 'Water System', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condElectricity', label: 'Electricity', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condFence', label: 'Fence', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'condSchoolBus', label: 'School Bus', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'assetsRemarks', label: 'Remarks', type: 'textarea' },
      ],
    },
    {
      id: 'stores', title: '14. School Stores & Learning Materials',
      fields: [
        {
          key: 'stores', type: 'table', label: 'School Stores',
          columns: [
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'opening', label: 'Opening Stock', type: 'number' },
            { key: 'received', label: 'Received', type: 'number' },
            { key: 'issued', label: 'Issued', type: 'number' },
            { key: 'closing', label: 'Closing Balance', type: 'number', readOnly: true, auto: (r) => (Number(r.opening) || 0) + (Number(r.received) || 0) - (Number(r.issued) || 0) },
            { key: 'condition', label: 'Condition', type: 'text' },
            { key: 'reorderNeeded', label: 'Reorder Needed?', type: 'yesno' },
          ],
        },
      ],
    },
    {
      id: 'financials', title: '15. Financial Summary',
      fields: [
        {
          key: 'income', type: 'table', label: 'Income',
          columns: [
            { key: 'source', label: 'Source', type: 'select', options: ['School Fees', 'Community Payments', 'Bursary Support', 'Government Support', 'Other Income'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Income' }],
        },
        {
          key: 'expenses', type: 'table', label: 'Expenses',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Stationery', 'Meals', 'Utilities', 'Repairs', 'ICT', 'Sports', 'Maintenance', 'Other'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Expenses' }],
        },
      ],
    },
    {
      id: 'community', title: '16. Community & Parent Engagement',
      fields: [
        {
          key: 'community', type: 'table', label: 'Community & Parent Engagement',
          columns: [
            { key: 'activity', label: 'Activity', type: 'select', options: ['Parents Meeting', 'SMC Meeting', 'PTA Meeting', 'Community Outreach', 'School Visit', 'Other'] },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'participants', label: 'Participants', type: 'number' },
            { key: 'outcome', label: 'Outcome', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'ministryLearners', title: '17. Ministry-supported Learners',
      fields: [
        {
          key: 'ministryLearners', type: 'table', label: 'Ministry-supported Learners',
          columns: [
            { key: 'learner', label: 'Learner', type: 'text' },
            { key: 'supportCategory', label: 'Support Category', type: 'select', options: ['Full Sponsorship', 'Partial Sponsorship', 'Staff Child', 'Community Child', 'Ministry Child', 'Bursary'] },
            { key: 'supportReceived', label: 'Support Received', type: 'text' },
            { key: 'attendance', label: 'Attendance', type: 'text' },
            { key: 'performance', label: 'Performance', type: 'text' },
            { key: 'concerns', label: 'Concerns', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'challenges', title: '18. Operational Challenges',
      fields: [
        { key: 'challenges', label: 'Academic, infrastructure, financial, staffing, learner welfare, ICT, sports, boarding challenges', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '19. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Teaching priorities, infrastructure improvements, training, sports, ICT, welfare, community engagement, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '20. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Management, Finance, ICT, Transport, Farm, Medical, HR, Parents, Donors', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '21. Declaration',
      fields: [
        { key: 'declName', label: 'Principal', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const ACCOUNTS_SCHEMA = {
  slug: 'accounts',
  title: 'Accounts & Finance Department Monthly Report',
  dashboard: [
    { label: 'Total Income (UGX)', icon: '💰', compute: (d) => sum(d.income, 'amount') },
    { label: 'Total Expenditure (UGX)', icon: '💸', compute: (d) => sum(d.expenditure, 'amount') },
    { label: 'Net Position (UGX)', icon: '📈', compute: (d) => sum(d.income, 'amount') - sum(d.expenditure, 'amount') },
    { label: 'Cash at Bank', icon: '🏦', compute: (d) => (Number(d.openingBankBalance) || 0) + (Number(d.deposits) || 0) - (Number(d.withdrawals) || 0) },
    { label: 'Cash on Hand', icon: '💵', compute: (d) => (Number(d.openingCashBalance) || 0) + (Number(d.cashReceived) || 0) - (Number(d.cashPaidOut) || 0) },
    { label: 'Payroll Processed', icon: '👥', compute: (d) => Number(d.numStaffPaid) || 0 },
    { label: 'Outstanding Receivables', icon: '📑', compute: (d) => (d.receivables || []).reduce((t, r) => t + ((Number(r.amountOutstanding) || 0) - (Number(r.amountReceived) || 0)), 0) },
    { label: 'Outstanding Payables', icon: '📄', compute: (d) => (d.payables || []).reduce((t, r) => t + ((Number(r.invoiceAmount) || 0) - (Number(r.amountPaid) || 0)), 0) },
    { label: 'Active Grants/Projects', icon: '🤝', compute: (d) => count(d.grants) },
    { label: 'Procurement Transactions', icon: '🛒', compute: (d) => count(d.procurement) },
    { label: 'Capital Purchases', icon: '🏢', compute: (d) => sum(d.assets, 'cost') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'accountant', label: 'Accountant/Finance Officer', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall Department Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: financial performance, major transactions, budget performance, compliance status, challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'income', title: '3. Income Summary',
      fields: [
        {
          key: 'income', type: 'table', label: 'Income',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'source', label: 'Income Source', type: 'select', options: ['School Fees', 'Children\'s Sponsorship', 'Donations', 'Church Offerings', 'Farm Sales', 'Guest House Income', 'Tailoring Income', 'Vocational Training', 'Grants', 'Fundraising', 'Investment Income', 'Other'] },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
            { key: 'receivedThrough', label: 'Received Through', type: 'select', options: ['Cash', 'Bank', 'Mobile Money', 'Cheque'] },
            { key: 'projectDept', label: 'Project/Department', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'amount', label: 'Total Income' }],
        },
      ],
    },
    {
      id: 'expenditure', title: '4. Expenditure Summary',
      fields: [
        {
          key: 'expenditure', type: 'table', label: 'Expenditure',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'department', label: 'Department', type: 'select', options: ['Administration', 'School', 'Children\'s Home', 'Medical', 'Farm', 'Transport', 'ICT', 'Security', 'Social Work', 'Tailoring', 'Guest House', 'Church', 'Other'] },
            { key: 'category', label: 'Expense Category', type: 'select', options: ['Salaries', 'Fuel', 'Medical', 'Utilities', 'Food', 'Repairs', 'Stationery', 'Procurement', 'Maintenance', 'Training', 'Capital Purchase', 'Other'] },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
            { key: 'budgetLine', label: 'Budget Line', type: 'text' },
            { key: 'paymentMethod', label: 'Payment Method', type: 'select', options: ['Cash', 'Bank', 'Mobile Money', 'Cheque'] },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'amount', label: 'Total Expenditure' }],
        },
      ],
    },
    {
      id: 'budget', title: '5. Budget Monitoring',
      fields: [
        {
          key: 'budget', type: 'table', label: 'Budget Monitoring',
          columns: [
            { key: 'department', label: 'Department', type: 'text' },
            { key: 'approvedBudget', label: 'Approved Budget', type: 'number' },
            { key: 'actualExpenditure', label: 'Actual Expenditure', type: 'number' },
            { key: 'variance', label: 'Variance', type: 'number', readOnly: true, auto: (r) => (Number(r.approvedBudget) || 0) - (Number(r.actualExpenditure) || 0) },
            { key: 'status', label: 'Status', type: 'select', options: ['Within Budget', 'Slightly Above Budget', 'Significantly Above Budget'] },
            { key: 'reasonForVariance', label: 'Reason for Variance', type: 'text' },
          ],
          totals: [{ column: 'approvedBudget', label: 'Total Approved' }, { column: 'actualExpenditure', label: 'Total Actual' }],
        },
      ],
    },
    {
      id: 'banking', title: '6. Banking & Cash Management',
      fields: [
        { key: 'openingBankBalance', label: 'Opening Bank Balance', type: 'number' },
        { key: 'deposits', label: 'Deposits', type: 'number' },
        { key: 'withdrawals', label: 'Withdrawals', type: 'number' },
        { key: 'closingBankBalance', label: 'Closing Bank Balance', type: 'number' },
        { key: 'openingCashBalance', label: 'Opening Cash Balance', type: 'number' },
        { key: 'cashReceived', label: 'Cash Received', type: 'number' },
        { key: 'cashPaidOut', label: 'Cash Paid Out', type: 'number' },
        { key: 'closingCashBalance', label: 'Closing Cash Balance', type: 'number' },
        { key: 'reconciliationCompleted', label: 'Bank Reconciliation Completed?', type: 'yesno' },
        { key: 'outstandingReconciling', label: 'Outstanding Reconciling Items', type: 'textarea' },
      ],
    },
    {
      id: 'payroll', title: '7. Payroll Management',
      fields: [
        { key: 'payrollMonth', label: 'Payroll Month', type: 'text' },
        { key: 'numStaffPaid', label: 'Number of Staff Paid', type: 'number' },
        { key: 'grossPayroll', label: 'Gross Payroll', type: 'number' },
        { key: 'statutoryDeductions', label: 'Statutory Deductions', type: 'number' },
        { key: 'netPayroll', label: 'Net Payroll', type: 'number' },
        { key: 'salaryAdvances', label: 'Salary Advances', type: 'number' },
        { key: 'overtime', label: 'Overtime', type: 'number' },
        { key: 'outstandingSalaries', label: 'Outstanding Salaries', type: 'number' },
      ],
    },
    {
      id: 'receivables', title: '8. Accounts Receivable',
      fields: [
        {
          key: 'receivables', type: 'table', label: 'Accounts Receivable',
          columns: [
            { key: 'debtor', label: 'Debtor', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['School Fees', 'Customer', 'Staff', 'Tenant', 'Partner', 'Other'] },
            { key: 'amountOutstanding', label: 'Amount Outstanding', type: 'number' },
            { key: 'dueDate', label: 'Due Date', type: 'date' },
            { key: 'amountReceived', label: 'Amount Received', type: 'number' },
            { key: 'balance', label: 'Balance', type: 'number', readOnly: true, auto: (r) => (Number(r.amountOutstanding) || 0) - (Number(r.amountReceived) || 0) },
            { key: 'status', label: 'Status', type: 'select', options: ['Current', 'Overdue'] },
            { key: 'followUpAction', label: 'Follow-up Action', type: 'text' },
          ],
          totals: [{ column: 'balance', label: 'Outstanding Receivables' }],
        },
      ],
    },
    {
      id: 'payables', title: '9. Accounts Payable',
      fields: [
        {
          key: 'payables', type: 'table', label: 'Accounts Payable',
          columns: [
            { key: 'supplier', label: 'Supplier', type: 'text' },
            { key: 'description', label: 'Description', type: 'text' },
            { key: 'invoiceAmount', label: 'Invoice Amount', type: 'number' },
            { key: 'amountPaid', label: 'Amount Paid', type: 'number' },
            { key: 'balance', label: 'Balance', type: 'number', readOnly: true, auto: (r) => (Number(r.invoiceAmount) || 0) - (Number(r.amountPaid) || 0) },
            { key: 'dueDate', label: 'Due Date', type: 'date' },
            { key: 'status', label: 'Status', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'balance', label: 'Outstanding Payables' }],
        },
      ],
    },
    {
      id: 'procurement', title: '10. Procurement & Payments',
      fields: [
        {
          key: 'procurement', type: 'table', label: 'Procurement & Payments',
          columns: [
            { key: 'prNumber', label: 'Purchase Request Number', type: 'text' },
            { key: 'department', label: 'Department', type: 'text' },
            { key: 'supplier', label: 'Supplier', type: 'text' },
            { key: 'item', label: 'Item Purchased', type: 'text' },
            { key: 'amount', label: 'Amount', type: 'number' },
            { key: 'paymentStatus', label: 'Payment Status', type: 'select', options: ['Paid', 'Partially Paid', 'Pending'] },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'amount', label: 'Total Procurement' }],
        },
      ],
    },
    {
      id: 'grants', title: '11. Grants & Donor Funds',
      fields: [
        {
          key: 'grants', type: 'table', label: 'Grants & Donor Funds',
          columns: [
            { key: 'donorGrant', label: 'Donor/Grant', type: 'text' },
            { key: 'project', label: 'Project', type: 'text' },
            { key: 'budget', label: 'Budget', type: 'number' },
            { key: 'fundsReceived', label: 'Funds Received', type: 'number' },
            { key: 'fundsSpent', label: 'Funds Spent', type: 'number' },
            { key: 'balance', label: 'Balance', type: 'number', readOnly: true, auto: (r) => (Number(r.fundsReceived) || 0) - (Number(r.fundsSpent) || 0) },
            { key: 'reportingStatus', label: 'Reporting Status', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'balance', label: 'Grant Balances' }],
        },
      ],
    },
    {
      id: 'assets', title: '12. Fixed Assets & Capital Purchases',
      fields: [
        {
          key: 'assets', type: 'table', label: 'Fixed Assets & Capital Purchases',
          columns: [
            { key: 'asset', label: 'Asset', type: 'text' },
            { key: 'department', label: 'Department', type: 'text' },
            { key: 'purchaseDate', label: 'Purchase Date', type: 'date' },
            { key: 'cost', label: 'Cost', type: 'number' },
            { key: 'supplier', label: 'Supplier', type: 'text' },
            { key: 'assetNumber', label: 'Asset Number', type: 'text' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'cost', label: 'Capital Expenditure' }],
        },
      ],
    },
    {
      id: 'compliance', title: '13. Statutory Compliance',
      fields: [
        { key: 'payeFiled', label: 'PAYE Filed?', type: 'yesno' },
        { key: 'nssfSubmitted', label: 'NSSF Submitted?', type: 'yesno' },
        { key: 'uraReturnsFiled', label: 'URA Returns Filed?', type: 'yesno' },
        { key: 'auditPreparation', label: 'Audit Preparation', type: 'text' },
        { key: 'policiesFollowed', label: 'Financial Policies Followed?', type: 'yesno' },
        { key: 'anyComplianceIssues', label: 'Any Compliance Issues?', type: 'yesno' },
        {
          key: 'complianceActivities', type: 'table', label: 'Compliance Activities',
          columns: [
            { key: 'activity', label: 'Activity', type: 'text' },
            { key: 'dueDate', label: 'Due Date', type: 'date' },
            { key: 'completed', label: 'Completed?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'controls', title: '14. Financial Controls',
      fields: [
        { key: 'cashCountConducted', label: 'Cash Count Conducted?', type: 'yesno' },
        { key: 'bankReconCompleted', label: 'Bank Reconciliation Completed?', type: 'yesno' },
        { key: 'pettyCashVerified', label: 'Petty Cash Verified?', type: 'yesno' },
        { key: 'supportingDocsAvailable', label: 'Supporting Documents Available?', type: 'yesno' },
        { key: 'internalControlsFollowed', label: 'Internal Controls Followed?', type: 'yesno' },
        { key: 'anyFraud', label: 'Any Fraud or Financial Irregularities?', type: 'yesno' },
        { key: 'fraudDetails', label: 'If Yes, provide details', type: 'textarea' },
      ],
    },
    {
      id: 'analysis', title: '15. Departmental Financial Analysis',
      fields: [
        { key: 'highestSpendingDept', label: 'Highest Spending Department', type: 'text' },
        { key: 'highestIncomeSource', label: 'Highest Income Source', type: 'text' },
        { key: 'largestExpenseCategory', label: 'Largest Expense Category', type: 'text' },
        { key: 'deptsExceedingBudget', label: 'Departments Exceeding Budget', type: 'text' },
        { key: 'majorCostSavings', label: 'Major Cost Savings', type: 'text' },
        { key: 'financialTrends', label: 'Financial Trends', type: 'textarea' },
      ],
    },
    {
      id: 'challenges', title: '16. Financial Challenges',
      fields: [
        { key: 'challenges', label: 'Cash flow challenges, budget constraints, outstanding debts, funding gaps, compliance challenges, system challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '17. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Budget reviews, financial reporting, grant reporting, collections, supplier payments, audit preparation, policy improvements, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '18. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Executive Director, Finance Committee, HR, Procurement, School, Children\'s Home, Department Heads, Donors', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '19. Declaration',
      fields: [
        { key: 'declName', label: 'Accountant', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const ICT_SCHEMA = {
  slug: 'ict',
  title: 'ICT & Digital Services Department Monthly Report',
  dashboard: [
    { label: 'Total ICT Assets', icon: '💻', compute: (d) => count(d.inventory) },
    { label: 'Functional Assets', icon: '🖥️', compute: (d) => countWhere(d.inventory, r => r.operational === 'Yes') },
    { label: 'Assets Requiring Repair', icon: '🔧', compute: (d) => countWhere(d.inventory, r => r.needsRepair === 'Yes') },
    { label: 'Support Requests', icon: '🛠️', compute: (d) => count(d.support) },
    { label: 'Support Resolved', icon: '✅', compute: (d) => countWhere(d.support, r => r.resolved === 'Yes') },
    { label: 'CCTV Working', icon: '📹', compute: (d) => countWhere(d.cctv, r => r.status === 'Working') },
    { label: 'Learners Trained', icon: '👩‍🏫', compute: (d) => sum(d.schoolProgramme, 'attendance') },
    { label: 'Vocational Trainees', icon: '🎓', compute: (d) => sum(d.vocational, 'numStudents') },
    { label: 'Staff Trained', icon: '👨‍💼', compute: (d) => sum(d.staffTraining, 'participants') },
    { label: 'Backup Activities', icon: '💾', compute: (d) => count(d.backups) },
    { label: 'ICT Expenditure', icon: '💰', compute: (d) => sum(d.financials, 'amount') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'ictOfficer', label: 'ICT Officer', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall Department Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: ICT services, major achievements, challenges, innovations introduced, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'inventory', title: '3. ICT Infrastructure Inventory',
      fields: [
        {
          key: 'inventory', type: 'table', label: 'ICT Infrastructure Inventory',
          columns: [
            { key: 'asset', label: 'Asset', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Desktop', 'Laptop', 'Server', 'Printer', 'Projector', 'Switch', 'Router', 'Access Point', 'CCTV Camera', 'DVR/NVR', 'UPS', 'Tablet', 'Television', 'Interactive Board', 'Other'] },
            { key: 'assetNumber', label: 'Asset Number', type: 'text' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'assignedTo', label: 'Assigned To', type: 'text' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'operational', label: 'Operational?', type: 'yesno' },
            { key: 'needsRepair', label: 'Needs Repair?', type: 'yesno' },
            { key: 'replacementNeeded', label: 'Replacement Needed?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'support', title: '4. Technical Support',
      fields: [
        {
          key: 'support', type: 'table', label: 'Technical Support',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'department', label: 'Department', type: 'select', options: ['Administration', 'School', 'Children\'s Home', 'Farm', 'Medical', 'Transport', 'Security', 'Social Work', 'Finance', 'Guest House', 'Church', 'Other'] },
            { key: 'issue', label: 'Issue Reported', type: 'text' },
            { key: 'priority', label: 'Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
            { key: 'resolution', label: 'Resolution', type: 'text' },
            { key: 'resolved', label: 'Resolved?', type: 'yesno' },
            { key: 'timeTaken', label: 'Time Taken', type: 'text' },
            { key: 'technician', label: 'Technician', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'schoolProgramme', title: '5. School ICT Programme',
      fields: [
        { key: 'ictLessonsConducted', label: 'ICT Lessons Conducted', type: 'number' },
        { key: 'codingLessons', label: 'Coding Lessons', type: 'number' },
        { key: 'practicalSessions', label: 'Computer Practical Sessions', type: 'number' },
        {
          key: 'schoolProgramme', type: 'table', label: 'School ICT Classes',
          columns: [
            { key: 'class', label: 'Class', type: 'text' },
            { key: 'lessons', label: 'Lessons', type: 'number' },
            { key: 'attendance', label: 'Attendance', type: 'number' },
            { key: 'skillsCovered', label: 'Skills Covered', type: 'text' },
            { key: 'challenges', label: 'Challenges', type: 'text' },
          ],
          totals: [{ column: 'attendance', label: 'Total Learners' }],
        },
      ],
    },
    {
      id: 'vocational', title: '6. Vocational ICT Training',
      fields: [
        {
          key: 'vocational', type: 'table', label: 'Vocational ICT Training',
          columns: [
            { key: 'course', label: 'Course', type: 'text' },
            { key: 'numStudents', label: 'Number of Students', type: 'number' },
            { key: 'lessonsConducted', label: 'Lessons Conducted', type: 'number' },
            { key: 'practicalSessions', label: 'Practical Sessions', type: 'number' },
            { key: 'assessmentConducted', label: 'Assessment Conducted?', type: 'yesno' },
            { key: 'completionRate', label: 'Completion Rate', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'numStudents', label: 'Vocational Students' }],
        },
      ],
    },
    {
      id: 'staffTraining', title: '7. Staff ICT Capacity Building',
      fields: [
        {
          key: 'staffTraining', type: 'table', label: 'Staff ICT Capacity Building',
          columns: [
            { key: 'training', label: 'Training', type: 'text' },
            { key: 'participants', label: 'Participants', type: 'number' },
            { key: 'department', label: 'Department', type: 'text' },
            { key: 'topicsCovered', label: 'Topics Covered', type: 'text' },
            { key: 'outcome', label: 'Outcome', type: 'text' },
            { key: 'recommendations', label: 'Recommendations', type: 'text' },
          ],
          totals: [{ column: 'participants', label: 'Staff Trained' }],
        },
      ],
    },
    {
      id: 'cctv', title: '8. CCTV & Security Systems',
      fields: [
        {
          key: 'cctv', type: 'table', label: 'CCTV & Security Systems',
          columns: [
            { key: 'location', label: 'Camera Location', type: 'text' },
            { key: 'cameraNumber', label: 'Camera Number', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Working', 'Faulty', 'Offline'] },
            { key: 'recordingProperly', label: 'Recording Properly?', type: 'yesno' },
            { key: 'storageAvailable', label: 'Storage Available?', type: 'yesno' },
            { key: 'maintenanceRequired', label: 'Maintenance Required?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'network', title: '9. Network & Internet Management',
      fields: [
        { key: 'isp', label: 'Internet Service Provider', type: 'text' },
        { key: 'avgUptime', label: 'Average Uptime %', type: 'number' },
        { key: 'downtimeHours', label: 'Downtime (Hours)', type: 'number' },
        { key: 'wifiCoverage', label: 'Wi-Fi Coverage', type: 'text' },
        { key: 'bandwidthPerformance', label: 'Bandwidth Performance', type: 'text' },
        {
          key: 'networkIssues', type: 'table', label: 'Network Issues',
          columns: [
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'internetStatus', label: 'Internet Status', type: 'text' },
            { key: 'speed', label: 'Speed', type: 'text' },
            { key: 'issue', label: 'Issue', type: 'text' },
            { key: 'actionTaken', label: 'Action Taken', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'website', title: '10. Website & Digital Platforms',
      fields: [
        { key: 'websiteUpdated', label: 'Website Updated?', type: 'yesno' },
        { key: 'socialMediaUpdated', label: 'Social Media Updated?', type: 'yesno' },
        { key: 'emailsCreated', label: 'Emails Created', type: 'number' },
        { key: 'emailsClosed', label: 'Emails Closed', type: 'number' },
        { key: 'digitalContent', label: 'Digital Content Produced', type: 'text' },
        { key: 'newsPublished', label: 'News Published', type: 'number' },
        { key: 'onlineMeetings', label: 'Online Meetings Supported', type: 'number' },
        { key: 'livestreams', label: 'Livestreams Supported', type: 'number' },
        { key: 'websiteRemarks', label: 'Remarks', type: 'text' },
      ],
    },
    {
      id: 'backup', title: '11. Data Backup & Cybersecurity',
      fields: [
        { key: 'backupsCompleted', label: 'Backups Completed?', type: 'yesno' },
        { key: 'cloudBackup', label: 'Cloud Backup?', type: 'yesno' },
        { key: 'serverBackup', label: 'Server Backup?', type: 'yesno' },
        { key: 'externalBackup', label: 'External Backup?', type: 'yesno' },
        { key: 'antivirusUpdated', label: 'Antivirus Updated?', type: 'yesno' },
        { key: 'passwordPolicyFollowed', label: 'Password Policy Followed?', type: 'yesno' },
        { key: 'securityIncidents', label: 'Security Incidents?', type: 'yesno' },
        { key: 'securityIncidentsDetails', label: 'If Yes, provide details', type: 'textarea' },
        {
          key: 'backups', type: 'table', label: 'Backup & Security Activities',
          columns: [
            { key: 'activity', label: 'Activity', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'status', label: 'Status', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'procurement', title: '12. ICT Procurement',
      fields: [
        {
          key: 'procurement', type: 'table', label: 'ICT Procurement',
          columns: [
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'supplier', label: 'Supplier', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'unitCost', label: 'Unit Cost', type: 'number' },
            { key: 'totalCost', label: 'Total Cost', type: 'number', readOnly: true, auto: (r) => (Number(r.quantity) || 0) * (Number(r.unitCost) || 0) },
            { key: 'fundingSource', label: 'Funding Source', type: 'text' },
            { key: 'received', label: 'Received?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'totalCost', label: 'Total ICT Purchases' }],
        },
      ],
    },
    {
      id: 'maintenance', title: '13. ICT Maintenance',
      fields: [
        {
          key: 'maintenance', type: 'table', label: 'ICT Maintenance',
          columns: [
            { key: 'equipment', label: 'Equipment', type: 'text' },
            { key: 'maintenanceType', label: 'Maintenance Type', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'cost', label: 'Cost', type: 'number' },
            { key: 'completed', label: 'Completed?', type: 'yesno' },
            { key: 'nextServiceDate', label: 'Next Service Date', type: 'date' },
          ],
          totals: [{ column: 'cost', label: 'Maintenance Cost' }],
        },
      ],
    },
    {
      id: 'software', title: '14. Software & Licensing',
      fields: [
        {
          key: 'software', type: 'table', label: 'Software & Licensing',
          columns: [
            { key: 'software', label: 'Software', type: 'text' },
            { key: 'licenseStatus', label: 'License Status', type: 'select', options: ['Valid', 'Expired', 'Trial', 'Free/Open Source'] },
            { key: 'expiryDate', label: 'Expiry Date', type: 'date' },
            { key: 'users', label: 'Users', type: 'number' },
            { key: 'renewalRequired', label: 'Renewal Required?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'av', title: '15. Audio Visual Support',
      fields: [
        {
          key: 'av', type: 'table', label: 'Audio Visual Support',
          columns: [
            { key: 'event', label: 'Event', type: 'text' },
            { key: 'eventType', label: 'Type', type: 'select', options: ['Church Service', 'School Function', 'Meeting', 'Training', 'Livestream', 'Other'] },
            { key: 'equipmentUsed', label: 'Equipment Used', type: 'text' },
            { key: 'challenges', label: 'Challenges', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'innovation', title: '16. Innovation & Digital Transformation',
      fields: [
        { key: 'innovation', label: 'Projects implemented, AI tools introduced, automation projects, digital systems improved, future innovations', type: 'textarea' },
      ],
    },
    {
      id: 'financials', title: '17. Financial Accountability',
      fields: [
        {
          key: 'financials', type: 'table', label: 'Expenses',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Equipment', 'Repairs', 'Internet', 'Software', 'Licensing', 'Training', 'Maintenance', 'Consumables', 'Other'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Department Expenditure' }],
        },
      ],
    },
    {
      id: 'challenges', title: '18. Challenges',
      fields: [
        { key: 'challenges', label: 'Network challenges, power challenges, equipment failures, budget constraints, training needs, cybersecurity risks, support challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '19. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Infrastructure improvements, purchases, training, maintenance, website updates, network expansion, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '20. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Executive Director, Finance, HR, School, Administration, Procurement, All Departments', type: 'textarea' },
      ],
    },
    {
      id: 'assetLifecycle', title: '21. ICT Asset Allocation & Lifecycle',
      fields: [
        {
          key: 'assetLifecycle', type: 'table', label: 'ICT Asset Allocation & Lifecycle',
          columns: [
            { key: 'assetTag', label: 'Asset Tag/Inventory Number', type: 'text' },
            { key: 'deviceName', label: 'Device Name', type: 'text' },
            { key: 'category', label: 'Category', type: 'text' },
            { key: 'deptAssigned', label: 'Department Assigned To', type: 'select', options: ['School', 'Children\'s Home', 'Medical', 'Farm', 'Transport', 'Administration', 'Security', 'Finance', 'ICT', 'Other'] },
            { key: 'primaryUser', label: 'Primary User', type: 'text' },
            { key: 'datePurchased', label: 'Date Purchased', type: 'date' },
            { key: 'warrantyExpiry', label: 'Warranty Expiry', type: 'date' },
            { key: 'replacementYear', label: 'Expected Replacement Year', type: 'text' },
            { key: 'condition', label: 'Current Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'maintenanceHistory', label: 'Maintenance History', type: 'text' },
            { key: 'currentStatus', label: 'Current Status', type: 'select', options: ['Active', 'In Repair', 'Retired', 'Lost'] },
            { key: 'replacementPriority', label: 'Replacement Priority', type: 'select', options: ['High', 'Medium', 'Low'] },
          ],
        },
      ],
    },
    {
      id: 'declaration', title: '22. Declaration',
      fields: [
        { key: 'declName', label: 'ICT Officer', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const PROCUREMENT_SCHEMA = {
  slug: 'procurement',
  title: 'Procurement & Stores Department Monthly Report',
  dashboard: [
    { label: 'Purchase Requests', icon: '📋', compute: (d) => count(d.requests) },
    { label: 'Requests Approved', icon: '✅', compute: (d) => countWhere(d.requests, r => r.status === 'Approved') },
    { label: 'Requests Pending', icon: '⏳', compute: (d) => countWhere(d.requests, r => r.status === 'Pending') },
    { label: 'Purchase Orders', icon: '🛒', compute: (d) => count(d.purchaseOrders) },
    { label: 'Deliveries Received', icon: '🚚', compute: (d) => count(d.goodsReceived) },
    { label: 'Items Issued', icon: '📦', compute: (d) => count(d.storesIssue) },
    { label: 'Low Stock Items', icon: '⚠️', compute: (d) => countWhere(d.inventory, r => r.reorderRequired === 'Yes') },
    { label: 'Assets Procured', icon: '🏢', compute: (d) => count(d.assetProcurement) },
    { label: 'Active Suppliers', icon: '🤝', compute: (d) => count(d.suppliers) },
    { label: 'Total Procurement Value', icon: '💰', compute: (d) => sum(d.purchaseOrders, 'totalCost') },
    { label: 'Procurement Savings', icon: '💵', compute: (d) => sum(d.quotations, 'estimatedSavings') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'procurementOfficer', label: 'Procurement Officer', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall Department Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: procurement activities completed, major purchases, supplier performance, inventory status, challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'requests', title: '3. Procurement Requests Register',
      fields: [
        {
          key: 'requests', type: 'table', label: 'Procurement Requests',
          columns: [
            { key: 'requestNumber', label: 'Request Number', type: 'text' },
            { key: 'dateReceived', label: 'Date Received', type: 'date' },
            { key: 'requestingDept', label: 'Requesting Department', type: 'select', options: ['Administration', 'School', 'Children\'s Home', 'Medical', 'Farm', 'Transport', 'ICT', 'Security', 'Social Work', 'Tailoring', 'Guest House', 'Church', 'Other'] },
            { key: 'item', label: 'Item Requested', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'urgency', label: 'Urgency', type: 'select', options: ['High', 'Medium', 'Low'] },
            { key: 'status', label: 'Request Status', type: 'select', options: ['Approved', 'Pending', 'Rejected', 'Procured'] },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'purchaseOrders', title: '4. Purchase Orders & Procurement Activities',
      fields: [
        {
          key: 'purchaseOrders', type: 'table', label: 'Purchase Orders',
          columns: [
            { key: 'poNumber', label: 'Purchase Order Number', type: 'text' },
            { key: 'supplier', label: 'Supplier', type: 'text' },
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'unitCost', label: 'Unit Cost', type: 'number' },
            { key: 'totalCost', label: 'Total Cost', type: 'number', readOnly: true, auto: (r) => (Number(r.quantity) || 0) * (Number(r.unitCost) || 0) },
            { key: 'department', label: 'Department', type: 'text' },
            { key: 'dateOrdered', label: 'Date Ordered', type: 'date' },
            { key: 'expectedDelivery', label: 'Expected Delivery Date', type: 'date' },
            { key: 'actualDelivery', label: 'Actual Delivery Date', type: 'date' },
            { key: 'status', label: 'Procurement Status', type: 'select', options: ['Ordered', 'Delivered', 'Pending', 'Cancelled'] },
          ],
          totals: [{ column: 'totalCost', label: 'Total Procurement Value' }],
        },
      ],
    },
    {
      id: 'suppliers', title: '5. Supplier Management',
      fields: [
        {
          key: 'suppliers', type: 'table', label: 'Supplier Management',
          columns: [
            { key: 'supplierName', label: 'Supplier Name', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Food Supplies', 'Construction Materials', 'Medical Supplies', 'ICT Equipment', 'Furniture', 'Stationery', 'Farm Inputs', 'Transport Parts', 'Other'] },
            { key: 'contactPerson', label: 'Contact Person', type: 'text' },
            { key: 'deliveriesCompleted', label: 'Deliveries Completed', type: 'number' },
            { key: 'timeliness', label: 'Delivery Timeliness', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'qualityRating', label: 'Quality Rating', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'paymentStatus', label: 'Payment Status', type: 'text' },
            { key: 'comments', label: 'Comments', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'quotations', title: '6. Quotations & Competitive Procurement',
      fields: [
        {
          key: 'quotations', type: 'table', label: 'Quotations & Competitive Procurement',
          columns: [
            { key: 'item', label: 'Procurement Item', type: 'text' },
            { key: 'numQuotations', label: 'Number of Quotations Obtained', type: 'number' },
            { key: 'supplierSelected', label: 'Supplier Selected', type: 'text' },
            { key: 'selectedPrice', label: 'Selected Price', type: 'number' },
            { key: 'lowestPrice', label: 'Lowest Price Offered', type: 'number' },
            { key: 'reasonForSelection', label: 'Reason for Selection', type: 'text' },
            { key: 'estimatedSavings', label: 'Estimated Savings', type: 'number' },
          ],
          totals: [{ column: 'estimatedSavings', label: 'Total Savings Achieved' }],
        },
      ],
    },
    {
      id: 'goodsReceived', title: '7. Goods Received Register',
      fields: [
        {
          key: 'goodsReceived', type: 'table', label: 'Goods Received',
          columns: [
            { key: 'dateReceived', label: 'Date Received', type: 'date' },
            { key: 'supplier', label: 'Supplier', type: 'text' },
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'quantityOrdered', label: 'Quantity Ordered', type: 'number' },
            { key: 'quantityReceived', label: 'Quantity Received', type: 'number' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Good', 'Damaged', 'Incomplete'] },
            { key: 'receivedBy', label: 'Received By', type: 'text' },
            { key: 'deliveryNote', label: 'Delivery Note Available?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'inventory', title: '8. Inventory & Stores Management',
      fields: [
        {
          key: 'inventory', type: 'table', label: 'Inventory & Stores',
          columns: [
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Food Items', 'Stationery', 'Cleaning Materials', 'Medical Supplies', 'Farm Inputs', 'ICT Consumables', 'Fuel', 'Building Materials', 'Other'] },
            { key: 'opening', label: 'Opening Stock', type: 'number' },
            { key: 'received', label: 'Received', type: 'number' },
            { key: 'issued', label: 'Issued', type: 'number' },
            { key: 'closing', label: 'Closing Stock', type: 'number', readOnly: true, auto: (r) => (Number(r.opening) || 0) + (Number(r.received) || 0) - (Number(r.issued) || 0) },
            { key: 'minStockLevel', label: 'Minimum Stock Level', type: 'number' },
            { key: 'reorderRequired', label: 'Reorder Required?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'storesIssue', title: '9. Stores Issue Register',
      fields: [
        {
          key: 'storesIssue', type: 'table', label: 'Stores Issue Register',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'item', label: 'Item Issued', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'departmentReceiving', label: 'Department Receiving', type: 'select', options: ['Administration', 'School', 'Children\'s Home', 'Medical', 'Farm', 'Transport', 'ICT', 'Security', 'Social Work', 'Tailoring', 'Guest House', 'Church', 'Other'] },
            { key: 'receivedBy', label: 'Received By', type: 'text' },
            { key: 'purpose', label: 'Purpose', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'assetProcurement', title: '10. Asset Procurement & Allocation',
      fields: [
        {
          key: 'assetProcurement', type: 'table', label: 'Asset Procurement & Allocation',
          columns: [
            { key: 'assetName', label: 'Asset Name', type: 'text' },
            { key: 'assetNumber', label: 'Asset Number', type: 'text' },
            { key: 'deptAssigned', label: 'Department Assigned To', type: 'text' },
            { key: 'purchaseCost', label: 'Purchase Cost', type: 'number' },
            { key: 'datePurchased', label: 'Date Purchased', type: 'date' },
            { key: 'supplier', label: 'Supplier', type: 'text' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'responsiblePerson', label: 'Responsible Person', type: 'text' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
          ],
          totals: [{ column: 'purchaseCost', label: 'Total Asset Cost' }],
        },
      ],
    },
    {
      id: 'compliance', title: '11. Procurement Compliance',
      fields: [
        { key: 'planFollowed', label: 'Procurement Plan Followed?', type: 'yesno' },
        { key: 'quotationsObtained', label: 'Quotations Obtained?', type: 'yesno' },
        { key: 'approvalsObtained', label: 'Approvals Obtained?', type: 'yesno' },
        { key: 'deliveryNotesAvailable', label: 'Delivery Notes Available?', type: 'yesno' },
        { key: 'paymentDocsComplete', label: 'Payment Documentation Complete?', type: 'yesno' },
        { key: 'assetRegisterUpdated', label: 'Asset Register Updated?', type: 'yesno' },
        {
          key: 'complianceActivities', type: 'table', label: 'Compliance Activities',
          columns: [
            { key: 'activity', label: 'Compliance Activity', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Complete', 'Incomplete', 'In Progress'] },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'contracts', title: '12. Contract & Service Provider Monitoring',
      fields: [
        {
          key: 'contracts', type: 'table', label: 'Contract & Service Provider Monitoring',
          columns: [
            { key: 'serviceProvider', label: 'Service Provider', type: 'text' },
            { key: 'serviceProvided', label: 'Service Provided', type: 'text' },
            { key: 'contractStart', label: 'Contract Start Date', type: 'date' },
            { key: 'contractEnd', label: 'Contract End Date', type: 'date' },
            { key: 'performanceRating', label: 'Performance Rating', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'renewalRequired', label: 'Renewal Required?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'financialSummary', title: '13. Procurement Financial Summary',
      fields: [
        {
          key: 'financialSummary', type: 'table', label: 'Procurement by Category',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Food Supplies', 'Medical Supplies', 'Farm Inputs', 'ICT Equipment', 'Stationery', 'Fuel', 'Construction Materials', 'Furniture', 'Repairs & Maintenance', 'Other'] },
            { key: 'budget', label: 'Budget', type: 'number' },
            { key: 'actualProcurement', label: 'Actual Procurement', type: 'number' },
            { key: 'variance', label: 'Variance', type: 'number', readOnly: true, auto: (r) => (Number(r.budget) || 0) - (Number(r.actualProcurement) || 0) },
          ],
          totals: [{ column: 'budget', label: 'Total Budget' }, { column: 'actualProcurement', label: 'Total Procured' }, { column: 'variance', label: 'Total Variance' }],
        },
      ],
    },
    {
      id: 'outstanding', title: '14. Outstanding Procurement Activities',
      fields: [
        {
          key: 'outstanding', type: 'table', label: 'Outstanding Procurement',
          columns: [
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'department', label: 'Department', type: 'text' },
            { key: 'supplier', label: 'Supplier', type: 'text' },
            { key: 'expectedCompletion', label: 'Expected Completion Date', type: 'date' },
            { key: 'reasonPending', label: 'Reason Pending', type: 'text' },
            { key: 'actionPlan', label: 'Action Plan', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'deptTracker', title: '15. Departmental Procurement Tracker',
      fields: [
        {
          key: 'deptTracker', type: 'table', label: 'Procurement Support by Department',
          columns: [
            { key: 'department', label: 'Department', type: 'select', options: ['Administration', 'School', 'Children\'s Home', 'Medical', 'Farm', 'Transport', 'ICT', 'Security', 'Social Work', 'Tailoring', 'Guest House', 'Church'] },
            { key: 'requestsSubmitted', label: 'Requests Submitted', type: 'number' },
            { key: 'requestsApproved', label: 'Requests Approved', type: 'number' },
            { key: 'requestsCompleted', label: 'Requests Completed', type: 'number' },
            { key: 'requestsPending', label: 'Requests Pending', type: 'number' },
            { key: 'totalValue', label: 'Total Procurement Value', type: 'number' },
            { key: 'avgCompletionTime', label: 'Average Completion Time', type: 'text' },
            { key: 'outstandingNeeds', label: 'Outstanding Needs', type: 'text' },
          ],
          totals: [{ column: 'totalValue', label: 'Total Value' }],
        },
      ],
    },
    {
      id: 'riskManagement', title: '16. Risk Management',
      fields: [
        { key: 'riskManagement', label: 'Procurement risks, supplier risks, fraud prevention measures, stock management risks, compliance risks, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'challenges', title: '17. Challenges',
      fields: [
        { key: 'challenges', label: 'Delayed deliveries, supplier issues, budget constraints, stock shortages, procurement process challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '18. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Major procurements planned, inventory replenishment, supplier evaluations, asset purchases, procurement training, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '19. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Executive Director, Finance Department, HR, Department Heads, Procurement Committee, Stores Team', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '20. Declaration',
      fields: [
        { key: 'declName', label: 'Procurement Officer', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const MAINTENANCE_SCHEMA = {
  slug: 'maintenance',
  title: 'Maintenance & Facilities Department Monthly Report',
  dashboard: [
    { label: 'Requests Received', icon: '🔧', compute: (d) => count(d.requests) },
    { label: 'Repairs Completed', icon: '✅', compute: (d) => countWhere(d.requests, r => r.status === 'Completed') },
    { label: 'Repairs Pending', icon: '⏳', compute: (d) => countWhere(d.requests, r => r.status === 'Pending' || r.status === 'In Progress') },
    { label: 'Emergency Repairs', icon: '🚨', compute: (d) => countWhere(d.requests, r => r.priority === 'Emergency') },
    { label: 'Buildings Inspected', icon: '🏢', compute: (d) => count(d.buildingInspection) },
    { label: 'Electrical Repairs', icon: '⚡', compute: (d) => countWhere(d.electrical, r => r.completed === 'Yes') },
    { label: 'Plumbing & Water Repairs', icon: '🚰', compute: (d) => countWhere(d.plumbing, r => r.completed === 'Yes') },
    { label: 'Furniture Repairs', icon: '🪑', compute: (d) => countWhere(d.furniture, r => r.repairRequired === 'Yes') },
    { label: 'Grounds Activities', icon: '🌳', compute: (d) => count(d.grounds) },
    { label: 'Construction Projects Active', icon: '🏗️', compute: (d) => countWhere(d.projects, r => r.status === 'In Progress') },
    { label: 'Maintenance Expenditure', icon: '💰', compute: (d) => sum(d.financialSummary, 'actualCost') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'maintenanceOfficer', label: 'Maintenance Officer / Department Head', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall Department Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: major maintenance works completed, infrastructure status, outstanding repairs, safety concerns, challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'requests', title: '3. Maintenance Requests Register',
      fields: [
        {
          key: 'requests', type: 'table', label: 'Maintenance Requests',
          columns: [
            { key: 'requestNumber', label: 'Request Number', type: 'text' },
            { key: 'dateReceived', label: 'Date Received', type: 'date' },
            { key: 'requestingDept', label: 'Requesting Department', type: 'select', options: ['Administration', 'School', 'Children\'s Home', 'Medical', 'Farm', 'Transport', 'ICT', 'Security', 'Social Work', 'Tailoring', 'Guest House', 'Church', 'Other'] },
            { key: 'issue', label: 'Issue Reported', type: 'text' },
            { key: 'priority', label: 'Priority', type: 'select', options: ['Emergency', 'High', 'Medium', 'Low'] },
            { key: 'assignedTechnician', label: 'Assigned Technician', type: 'text' },
            { key: 'status', label: 'Status', type: 'select', options: ['Pending', 'In Progress', 'Completed', 'Deferred'] },
            { key: 'completionDate', label: 'Completion Date', type: 'date' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'buildingInspection', title: '4. Building & Facility Inspection',
      fields: [
        {
          key: 'buildingInspection', type: 'table', label: 'Building & Facility Inspection',
          columns: [
            { key: 'facility', label: 'Facility/Building', type: 'select', options: ['Administration Block', 'Nursery School', 'Primary School', 'ICT Lab', 'Library', 'Children\'s Home - Nazareth', 'Children\'s Home - Jerusalem', 'Children\'s Home - Shilo', 'Children\'s Home - Bethlehem', 'Children\'s Home - Zion', 'Children\'s Home - Jericho', 'Medical Centre', 'Guest House', 'Church', 'Farm Structures', 'Staff Houses', 'Stores', 'Security Posts', 'Other'] },
            { key: 'inspectionDate', label: 'Inspection Date', type: 'date' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'] },
            { key: 'issuesIdentified', label: 'Issues Identified', type: 'text' },
            { key: 'actionRequired', label: 'Action Required', type: 'text' },
            { key: 'estimatedCost', label: 'Estimated Cost', type: 'number' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'electrical', title: '5. Electrical Maintenance',
      fields: [
        {
          key: 'electrical', type: 'table', label: 'Electrical Maintenance',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'issue', label: 'Issue', type: 'text' },
            { key: 'workDone', label: 'Work Done', type: 'text' },
            { key: 'materialsUsed', label: 'Materials Used', type: 'text' },
            { key: 'cost', label: 'Cost', type: 'number' },
            { key: 'completed', label: 'Completed?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'cost', label: 'Total Electrical Cost' }],
        },
      ],
    },
    {
      id: 'plumbing', title: '6. Plumbing & Water Systems',
      fields: [
        {
          key: 'plumbing', type: 'table', label: 'Plumbing & Water Systems',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'issue', label: 'Issue', type: 'text' },
            { key: 'repairConducted', label: 'Repair Conducted', type: 'text' },
            { key: 'materialsUsed', label: 'Materials Used', type: 'text' },
            { key: 'cost', label: 'Cost', type: 'number' },
            { key: 'completed', label: 'Completed?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'cost', label: 'Total Plumbing Cost' }],
        },
      ],
    },
    {
      id: 'waterSupply', title: '7. Water Supply & Sanitation',
      fields: [
        { key: 'waterAvailability', label: 'Water Availability Status', type: 'select', options: ['Adequate', 'Limited', 'Critical'] },
        { key: 'boreholeStatus', label: 'Borehole Status', type: 'text' },
        { key: 'waterTankStatus', label: 'Water Tank Status', type: 'text' },
        { key: 'waterPumpStatus', label: 'Water Pump Status', type: 'text' },
        { key: 'sanitationStatus', label: 'Sanitation Status', type: 'text' },
        {
          key: 'waterSanitation', type: 'table', label: 'Water/Sanitation Issues',
          columns: [
            { key: 'facility', label: 'Facility', type: 'text' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor', 'Critical'] },
            { key: 'issue', label: 'Issue', type: 'text' },
            { key: 'actionTaken', label: 'Action Taken', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'furniture', title: '8. Furniture & Equipment Maintenance',
      fields: [
        {
          key: 'furniture', type: 'table', label: 'Furniture & Equipment Maintenance',
          columns: [
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Desk', 'Chair', 'Bed', 'Mattress', 'Cabinet', 'Shelf', 'Table', 'Door', 'Window', 'Other'] },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'repairRequired', label: 'Repair Required?', type: 'yesno' },
            { key: 'replacementRequired', label: 'Replacement Required?', type: 'yesno' },
            { key: 'actionTaken', label: 'Action Taken', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'grounds', title: '9. Grounds & Compound Maintenance',
      fields: [
        {
          key: 'grounds', type: 'table', label: 'Grounds & Compound Maintenance',
          columns: [
            { key: 'activity', label: 'Activity', type: 'select', options: ['Grass Cutting', 'Tree Trimming', 'Drainage Maintenance', 'Road Maintenance', 'Compound Cleaning', 'Waste Management', 'Landscaping', 'Other'] },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'status', label: 'Status', type: 'select', options: ['Completed', 'In Progress', 'Pending'] },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'projects', title: '10. Construction & Renovation Projects',
      fields: [
        {
          key: 'projects', type: 'table', label: 'Construction & Renovation Projects',
          columns: [
            { key: 'projectName', label: 'Project Name', type: 'text' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'startDate', label: 'Start Date', type: 'date' },
            { key: 'expectedCompletion', label: 'Expected Completion', type: 'date' },
            { key: 'progress', label: 'Progress %', type: 'number' },
            { key: 'budget', label: 'Budget', type: 'number' },
            { key: 'amountSpent', label: 'Amount Spent', type: 'number' },
            { key: 'variance', label: 'Variance', type: 'number', readOnly: true, auto: (r) => (Number(r.budget) || 0) - (Number(r.amountSpent) || 0) },
            { key: 'status', label: 'Status', type: 'select', options: ['Planning', 'In Progress', 'Completed', 'Delayed'] },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'amountSpent', label: 'Project Expenditure' }],
        },
      ],
    },
    {
      id: 'tools', title: '11. Tools & Maintenance Equipment',
      fields: [
        {
          key: 'tools', type: 'table', label: 'Tools & Maintenance Equipment',
          columns: [
            { key: 'tool', label: 'Tool/Equipment', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'operational', label: 'Operational?', type: 'yesno' },
            { key: 'needsRepair', label: 'Needs Repair?', type: 'yesno' },
            { key: 'needsReplacement', label: 'Needs Replacement?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'consumables', title: '12. Fuel & Consumables Usage',
      fields: [
        {
          key: 'consumables', type: 'table', label: 'Fuel & Consumables Usage',
          columns: [
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'opening', label: 'Opening Stock', type: 'number' },
            { key: 'received', label: 'Received', type: 'number' },
            { key: 'used', label: 'Used', type: 'number' },
            { key: 'closing', label: 'Closing Stock', type: 'number', readOnly: true, auto: (r) => (Number(r.opening) || 0) + (Number(r.received) || 0) - (Number(r.used) || 0) },
            { key: 'reorderRequired', label: 'Reorder Required?', type: 'yesno' },
          ],
        },
      ],
    },
    {
      id: 'safety', title: '13. Safety & Compliance',
      fields: [
        { key: 'fireExtinguishersInspected', label: 'Fire Extinguishers Inspected?', type: 'yesno' },
        { key: 'emergencyExitsFunctional', label: 'Emergency Exits Functional?', type: 'yesno' },
        { key: 'hazardousAreasIdentified', label: 'Hazardous Areas Identified?', type: 'yesno' },
        { key: 'safetySignageAvailable', label: 'Safety Signage Available?', type: 'yesno' },
        { key: 'protectiveEquipmentAvailable', label: 'Protective Equipment Available?', type: 'yesno' },
        { key: 'anySafetyIncidents', label: 'Any Safety Incidents?', type: 'yesno' },
        { key: 'safetyIncidentsDetails', label: 'If Yes, provide details', type: 'textarea' },
      ],
    },
    {
      id: 'assetCondition', title: '14. Department Asset Condition Summary',
      fields: [
        {
          key: 'assetCondition', type: 'table', label: 'Department Asset Condition Summary',
          columns: [
            { key: 'department', label: 'Department', type: 'select', options: ['School', 'Children\'s Home', 'Medical', 'ICT', 'Transport', 'Farm', 'Security', 'Guest House', 'Church', 'Administration'] },
            { key: 'assetType', label: 'Asset Type', type: 'text' },
            { key: 'numberInspected', label: 'Number Inspected', type: 'number' },
            { key: 'goodCondition', label: 'Good Condition', type: 'number' },
            { key: 'needsRepair', label: 'Needs Repair', type: 'number' },
            { key: 'needsReplacement', label: 'Needs Replacement', type: 'number' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'financialSummary', title: '15. Maintenance Financial Summary',
      fields: [
        {
          key: 'financialSummary', type: 'table', label: 'Maintenance by Category',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Building Repairs', 'Electrical', 'Plumbing', 'Water Systems', 'Furniture', 'Grounds Maintenance', 'Construction Projects', 'Equipment Repairs', 'Emergency Repairs', 'Other'] },
            { key: 'budget', label: 'Budget', type: 'number' },
            { key: 'actualCost', label: 'Actual Cost', type: 'number' },
            { key: 'variance', label: 'Variance', type: 'number', readOnly: true, auto: (r) => (Number(r.budget) || 0) - (Number(r.actualCost) || 0) },
          ],
          totals: [{ column: 'budget', label: 'Total Budget' }, { column: 'actualCost', label: 'Total Maintenance Expenditure' }],
        },
      ],
    },
    {
      id: 'outstanding', title: '16. Outstanding Repairs',
      fields: [
        {
          key: 'outstanding', type: 'table', label: 'Outstanding Repairs',
          columns: [
            { key: 'issue', label: 'Issue', type: 'text' },
            { key: 'location', label: 'Location', type: 'text' },
            { key: 'priority', label: 'Priority', type: 'select', options: ['Emergency', 'High', 'Medium', 'Low'] },
            { key: 'estimatedCost', label: 'Estimated Cost', type: 'number' },
            { key: 'reasonOutstanding', label: 'Reason Outstanding', type: 'text' },
            { key: 'plannedCompletion', label: 'Planned Completion Date', type: 'date' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'preventive', title: '17. Preventive Maintenance Schedule',
      fields: [
        {
          key: 'preventive', type: 'table', label: 'Preventive Maintenance Tracker',
          columns: [
            { key: 'assetFacility', label: 'Asset/Facility', type: 'text' },
            { key: 'lastServiceDate', label: 'Last Service Date', type: 'date' },
            { key: 'nextServiceDate', label: 'Next Service Date', type: 'date' },
            { key: 'responsibleTechnician', label: 'Responsible Technician', type: 'text' },
            { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['High', 'Medium', 'Low'] },
            { key: 'serviceStatus', label: 'Service Status', type: 'select', options: ['Up to date', 'Due', 'Overdue'] },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'challenges', title: '18. Challenges',
      fields: [
        { key: 'challenges', label: 'Staffing challenges, equipment challenges, budget constraints, infrastructure challenges, water supply challenges, material shortages, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '19. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Major repairs planned, construction projects, preventive maintenance activities, asset replacements, safety improvements, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '20. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Executive Director, Finance, Procurement, Security, School, Children\'s Home, Farm, Transport', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '21. Declaration',
      fields: [
        { key: 'declName', label: 'Maintenance Officer', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const CHILDRENS_HOME_SCHEMA = {
  slug: 'childrens_home',
  title: 'Children\'s Home Department Monthly Report',
  dashboard: [
    { label: 'Total Homes Reporting', icon: '🏠', compute: (d) => count(d.homeSummary) },
    { label: 'Total Children', icon: '👧', compute: (d) => sum(d.homeSummary, 'boys') + sum(d.homeSummary, 'girls') },
    { label: 'Boys', icon: '👦', compute: (d) => sum(d.homeSummary, 'boys') },
    { label: 'Girls', icon: '👧', compute: (d) => sum(d.homeSummary, 'girls') },
    { label: 'School-going', icon: '📚', compute: (d) => sum(d.homeSummary, 'schoolGoing') },
    { label: 'Under Five', icon: '🍼', compute: (d) => sum(d.homeSummary, 'underFive') },
    { label: 'Special Needs Children', icon: '🌟', compute: (d) => count(d.specialNeeds) },
    { label: 'Medical Cases', icon: '❤️', compute: (d) => sum(d.health, 'sickChildren') },
    { label: 'Hospital Referrals', icon: '🏥', compute: (d) => sum(d.health, 'hospitalReferrals') },
    { label: 'Discipline Cases', icon: '⚖️', compute: (d) => count(d.behaviour) },
    { label: 'Safeguarding Cases', icon: '🛡️', compute: (d) => count(d.safeguarding) },
    { label: 'Family Contacts', icon: '📞', compute: (d) => count(d.familyContact) },
    { label: 'Department Expenditure', icon: '💰', compute: (d) => sum(d.expenditure, 'amount') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'headAuntie', label: 'Head Auntie Name', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall Department Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: children\'s welfare, major achievements, challenges, department performance, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'homeSummary', title: '3. Home Summary',
      fields: [
        {
          key: 'homeSummary', type: 'table', label: 'Home Summary (one row per home)',
          columns: [
            { key: 'homeName', label: 'Home Name', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'houseMother', label: 'House Mother', type: 'text' },
            { key: 'boys', label: 'Boys', type: 'number' },
            { key: 'girls', label: 'Girls', type: 'number' },
            { key: 'totalChildren', label: 'Total Children', type: 'number', readOnly: true, auto: (r) => (Number(r.boys) || 0) + (Number(r.girls) || 0) },
            { key: 'schoolGoing', label: 'School-going', type: 'number' },
            { key: 'underFive', label: 'Under Five', type: 'number' },
            { key: 'specialNeedsChildren', label: 'Special Needs Children', type: 'number' },
            { key: 'homeCondition', label: 'Home Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
            { key: 'majorAchievement', label: 'Major Achievement', type: 'text' },
            { key: 'majorConcern', label: 'Major Concern', type: 'text' },
          ],
          totals: [{ column: 'boys', label: 'Total Boys' }, { column: 'girls', label: 'Total Girls' }, { column: 'totalChildren', label: 'Total Children' }],
        },
      ],
    },
    {
      id: 'welfare', title: '4. Child Welfare Summary',
      fields: [
        {
          key: 'welfare', type: 'table', label: 'Child Welfare Summary (by home)',
          columns: [
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'thriving', label: 'Children Thriving', type: 'number' },
            { key: 'closeMonitoring', label: 'Requiring Close Monitoring', type: 'number' },
            { key: 'newAdmissions', label: 'New Admissions', type: 'number' },
            { key: 'exited', label: 'Exited/Reintegrated', type: 'number' },
            { key: 'behaviourConcerns', label: 'Behaviour Concerns', type: 'number' },
            { key: 'emotionalConcerns', label: 'Emotional Wellbeing Concerns', type: 'number' },
            { key: 'specialIntervention', label: 'Requiring Special Intervention', type: 'number' },
          ],
          totals: [{ column: 'thriving', label: 'Total Thriving' }, { column: 'newAdmissions', label: 'Total Admissions' }, { column: 'exited', label: 'Total Exited' }],
        },
      ],
    },
    {
      id: 'health', title: '5. Health & Medical Summary',
      fields: [
        {
          key: 'health', type: 'table', label: 'Health & Medical Summary (by home)',
          columns: [
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'sickChildren', label: 'Sick Children Treated', type: 'number' },
            { key: 'hospitalReferrals', label: 'Hospital Referrals', type: 'number' },
            { key: 'clinicVisits', label: 'Clinic Visits', type: 'number' },
            { key: 'medicationFollowUps', label: 'Medication Follow-ups', type: 'number' },
            { key: 'chronicIllnesses', label: 'Chronic Illnesses', type: 'number' },
            { key: 'nutritionConcerns', label: 'Nutrition Concerns', type: 'text' },
          ],
          totals: [{ column: 'sickChildren', label: 'Total Medical Cases' }, { column: 'hospitalReferrals', label: 'Total Hospital Referrals' }],
        },
      ],
    },
    {
      id: 'specialNeeds', title: '6. Special Needs Follow-up',
      fields: [
        {
          key: 'specialNeeds', type: 'table', label: 'Special Needs Follow-up',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'diagnosis', label: 'Diagnosis/Special Need', type: 'text' },
            { key: 'therapyReceived', label: 'Therapy Received', type: 'text' },
            { key: 'schoolSupport', label: 'School Support', type: 'text' },
            { key: 'medicalFollowUp', label: 'Medical Follow-up', type: 'text' },
            { key: 'progress', label: 'Progress', type: 'text' },
            { key: 'challenges', label: 'Challenges', type: 'text' },
            { key: 'additionalSupport', label: 'Additional Support Needed', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'education', title: '7. Education Monitoring',
      fields: [
        {
          key: 'education', type: 'table', label: 'Education Monitoring (by home)',
          columns: [
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'attendingSchool', label: 'Children Attending School', type: 'number' },
            { key: 'homeworkSupervision', label: 'Homework Supervision', type: 'text' },
            { key: 'readingParticipation', label: 'Reading Programme Participation', type: 'text' },
            { key: 'academicConcerns', label: 'Academic Concerns', type: 'text' },
            { key: 'remedialSupport', label: 'Requiring Remedial Support', type: 'number' },
            { key: 'teacherConcerns', label: 'Teacher Concerns', type: 'text' },
          ],
          totals: [{ column: 'attendingSchool', label: 'Total Attending School' }, { column: 'remedialSupport', label: 'Total Remedial' }],
        },
      ],
    },
    {
      id: 'behaviour', title: '8. Behaviour & Discipline',
      fields: [
        {
          key: 'behaviour', type: 'table', label: 'Behaviour & Discipline',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'behaviourIssue', label: 'Behaviour Issue', type: 'text' },
            { key: 'actionTaken', label: 'Action Taken', type: 'text' },
            { key: 'counselingConducted', label: 'Counseling Conducted?', type: 'yesno' },
            { key: 'socialWorkerInvolved', label: 'Social Worker Involved?', type: 'yesno' },
            { key: 'currentStatus', label: 'Current Status', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'spiritual', title: '9. Spiritual Development',
      fields: [
        {
          key: 'spiritual', type: 'table', label: 'Spiritual Development (by home)',
          columns: [
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'devotions', label: 'Home Devotions Held', type: 'number' },
            { key: 'bibleStudies', label: 'Bible Studies', type: 'number' },
            { key: 'prayerMeetings', label: 'Prayer Meetings', type: 'number' },
            { key: 'churchAttendance', label: 'Church Attendance', type: 'text' },
            { key: 'memoryVerses', label: 'Memory Verses', type: 'text' },
            { key: 'spiritualCounseling', label: 'Spiritual Counseling Sessions', type: 'number' },
            { key: 'spiritualDecisions', label: 'Children Making Spiritual Decisions', type: 'number' },
          ],
          totals: [{ column: 'devotions', label: 'Total Devotions' }, { column: 'spiritualDecisions', label: 'Total Decisions' }],
        },
      ],
    },
    {
      id: 'familyContact', title: '10. Family Contact & Reintegration',
      fields: [
        {
          key: 'familyContact', type: 'table', label: 'Family Contact & Reintegration',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'familyContact', label: 'Family Contact', type: 'text' },
            { key: 'phoneCalls', label: 'Phone Calls', type: 'number' },
            { key: 'homeVisits', label: 'Home Visits', type: 'number' },
            { key: 'reintegrationProgress', label: 'Reintegration Progress', type: 'text' },
            { key: 'followUpNeeded', label: 'Follow-up Needed?', type: 'yesno' },
          ],
          totals: [{ column: 'phoneCalls', label: 'Total Phone Calls' }, { column: 'homeVisits', label: 'Total Home Visits' }],
        },
      ],
    },
    {
      id: 'safeguarding', title: '11. Child Protection & Safeguarding',
      fields: [
        { key: 'anySafeguarding', label: 'Any safeguarding concerns?', type: 'yesno' },
        {
          key: 'safeguarding', type: 'table', label: 'Safeguarding Concerns (if any)',
          columns: [
            { key: 'child', label: 'Child', type: 'text' },
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'concern', label: 'Concern', type: 'text' },
            { key: 'riskLevel', label: 'Risk Level', type: 'select', options: ['Low', 'Medium', 'High'] },
            { key: 'immediateAction', label: 'Immediate Action', type: 'text' },
            { key: 'reportedTo', label: 'Reported To', type: 'text' },
            { key: 'currentStatus', label: 'Current Status', type: 'text' },
            { key: 'followUp', label: 'Follow-up', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'supplies', title: '12. Household Supplies',
      fields: [
        {
          key: 'supplies', type: 'table', label: 'Household Supplies (by home)',
          columns: [
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'food', label: 'Food', type: 'text' },
            { key: 'soap', label: 'Soap', type: 'text' },
            { key: 'toothpaste', label: 'Toothpaste', type: 'text' },
            { key: 'detergent', label: 'Detergent', type: 'text' },
            { key: 'charcoal', label: 'Charcoal', type: 'text' },
            { key: 'firewood', label: 'Firewood', type: 'text' },
            { key: 'cookingGas', label: 'Cooking Gas', type: 'text' },
            { key: 'toiletPaper', label: 'Toilet Paper', type: 'text' },
            { key: 'otherSupplies', label: 'Other Supplies', type: 'text' },
            { key: 'supplyStatus', label: 'Supply Status', type: 'select', options: ['Adequate', 'Low', 'Out of Stock'] },
            { key: 'additionalNeeds', label: 'Additional Needs', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'assets', title: '13. Home Assets & Equipment',
      fields: [
        {
          key: 'assets', type: 'table', label: 'Home Assets & Equipment',
          columns: [
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'needsRepair', label: 'Needs Repair?', type: 'yesno' },
            { key: 'needsReplacement', label: 'Needs Replacement?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'expenditure', title: '14. Household Expenditure',
      fields: [
        {
          key: 'expenditure', type: 'table', label: 'Household Expenditure',
          columns: [
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho', 'All Homes'] },
            { key: 'category', label: 'Category', type: 'select', options: ['Food', 'Household Supplies', 'Medical Emergencies', 'Transport', 'Emergency Purchases', 'Repairs', 'Other'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Department Expenditure' }],
        },
      ],
    },
    {
      id: 'staffing', title: '15. Staffing',
      fields: [
        { key: 'totalAunties', label: 'Total Aunties', type: 'number' },
        { key: 'reliefStaff', label: 'Relief Staff', type: 'number' },
        { key: 'nightCaregivers', label: 'Night Caregivers', type: 'number' },
        { key: 'attendance', label: 'Attendance', type: 'text' },
        { key: 'leave', label: 'Leave', type: 'text' },
        { key: 'trainingConducted', label: 'Training Conducted', type: 'text' },
        { key: 'staffChallenges', label: 'Staff Challenges', type: 'textarea' },
        { key: 'staffWelfare', label: 'Staff Welfare', type: 'textarea' },
        { key: 'vacantPositions', label: 'Vacant Positions', type: 'number' },
      ],
    },
    {
      id: 'environment', title: '16. Home Environment Assessment',
      fields: [
        {
          key: 'environment', type: 'table', label: 'Home Environment Assessment (rate each home)',
          columns: [
            { key: 'home', label: 'Home', type: 'select', options: ['Nazareth', 'Jerusalem', 'Shilo', 'Bethlehem', 'Zion', 'Jericho'] },
            { key: 'cleanliness', label: 'Cleanliness', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'kitchen', label: 'Kitchen', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'bedrooms', label: 'Bedrooms', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'bathrooms', label: 'Bathrooms', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'waterSupply', label: 'Water Supply', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'security', label: 'Security', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'familyAtmosphere', label: 'Family Atmosphere', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'safety', label: 'Safety', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'maintenance', label: 'Maintenance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
          ],
        },
      ],
    },
    {
      id: 'activities', title: '17. Major Activities',
      fields: [
        {
          key: 'activities', type: 'table', label: 'Major Activities',
          columns: [
            { key: 'activity', label: 'Activity', type: 'select', options: ['Birthday', 'Outing', 'Holiday Programme', 'Life Skills Training', 'Sports', 'Counseling', 'Medical Camp', 'Visitors', 'Community Activity', 'Other'] },
            { key: 'home', label: 'Home', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'participants', label: 'Participants', type: 'number' },
            { key: 'outcome', label: 'Outcome', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'challenges', title: '18. Challenges',
      fields: [
        { key: 'challenges', label: 'Behaviour, health, food, staffing, infrastructure, finances, education, safeguarding challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '19. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Planned activities, children requiring follow-up, repairs, training, purchases, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '20. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Executive Director, Finance, Medical Department, Social Work, School, Procurement, Maintenance, HR', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '21. Declaration',
      fields: [
        { key: 'declName', label: 'Head Auntie', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

const TAILORING_SCHEMA = {
  slug: 'tailoring',
  title: 'Tailoring & Garment Production Department Monthly Report',
  dashboard: [
    { label: 'Total Active Learners', icon: '🧵', compute: (d) => count(d.enrollment) },
    { label: 'Ministry Learners', icon: '👩‍🎓', compute: (d) => countWhere(d.enrollment, r => r.category === 'Ministry Child') },
    { label: 'Community Learners', icon: '👥', compute: (d) => countWhere(d.enrollment, r => r.category === 'Community Learner') },
    { label: 'Staff Trainees', icon: '👔', compute: (d) => countWhere(d.enrollment, r => r.category === 'Staff') },
    { label: 'Garments Produced', icon: '👕', compute: (d) => sum(d.production, 'quantityCompleted') },
    { label: 'Repairs Completed', icon: '🪡', compute: (d) => countWhere(d.repairs, r => r.completed === 'Yes') },
    { label: 'Customer Orders', icon: '🛍️', compute: (d) => countWhere(d.customerOrders, r => r.status === 'Completed') },
    { label: 'Internal Supplies', icon: '📦', compute: (d) => sum(d.ministrySupply, 'quantity') },
    { label: 'Department Income', icon: '💰', compute: (d) => sum(d.income, 'amount') },
    { label: 'Department Expenditure', icon: '💸', compute: (d) => sum(d.expenses, 'amount') },
    { label: 'Net Position', icon: '📈', compute: (d) => sum(d.income, 'amount') - sum(d.expenses, 'amount') },
    { label: 'Machines Requiring Repair', icon: '🛠️', compute: (d) => countWhere(d.equipment, r => r.needsRepair === 'Yes') },
  ],
  sections: [
    {
      id: 'info', title: '1. Report Information',
      fields: [
        { key: 'reportMonth', label: 'Reporting Month & Year', type: 'text', autoFill: 'monthYear', readOnly: true },
        { key: 'dateSubmitted', label: 'Date Submitted', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'instructor', label: 'Tailoring Instructor / Department Head', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'departmentEmail', label: 'Department Email', type: 'text', autoFill: 'submitterEmail', readOnly: true },
        { key: 'performance', label: 'Overall Department Performance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Needs Attention'] },
      ],
    },
    {
      id: 'summary', title: '2. Executive Summary',
      fields: [
        { key: 'execSummary', label: 'Summarize: training activities, production achievements, customer work completed, major challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'enrollment', title: '3. Learner Enrollment & Attendance',
      fields: [
        {
          key: 'enrollment', type: 'table', label: 'Learner Enrollment & Attendance',
          columns: [
            { key: 'learnerName', label: 'Learner Name', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Ministry Child', 'Community Learner', 'Staff', 'Volunteer', 'Apprentice'] },
            { key: 'age', label: 'Age', type: 'number' },
            { key: 'gender', label: 'Gender', type: 'select', options: ['Male', 'Female'] },
            { key: 'trainingLevel', label: 'Training Level', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced'] },
            { key: 'attendance', label: 'Attendance (%)', type: 'number' },
            { key: 'practicalParticipation', label: 'Practical Participation', type: 'text' },
            { key: 'progressRating', label: 'Progress Rating', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'training', title: '4. Training Activities',
      fields: [
        {
          key: 'training', type: 'table', label: 'Training Activities',
          columns: [
            { key: 'topic', label: 'Training Topic', type: 'select', options: ['Machine Operation', 'Hand Stitching', 'Pattern Drafting', 'Garment Cutting', 'Uniform Making', 'Repairs & Alterations', 'Business Skills', 'Entrepreneurship', 'Customer Care', 'Other'] },
            { key: 'numSessions', label: 'Number of Sessions', type: 'number' },
            { key: 'learnersAttended', label: 'Learners Attended', type: 'number' },
            { key: 'practicalExercises', label: 'Practical Exercises Completed', type: 'number' },
            { key: 'competencies', label: 'Competencies Acquired', type: 'text' },
            { key: 'challenges', label: 'Challenges', type: 'text' },
            { key: 'recommendations', label: 'Recommendations', type: 'text' },
          ],
          totals: [{ column: 'numSessions', label: 'Total Training Sessions' }],
        },
      ],
    },
    {
      id: 'production', title: '5. Production Summary',
      fields: [
        {
          key: 'production', type: 'table', label: 'Production Summary',
          columns: [
            { key: 'item', label: 'Item Produced', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['School Uniform', 'Children\'s Clothing', 'Dresses', 'Shirts', 'Trousers', 'Skirts', 'Curtains', 'Bedding', 'Bags', 'Other'] },
            { key: 'quantityProduced', label: 'Quantity Produced', type: 'number' },
            { key: 'quantityCompleted', label: 'Quantity Completed', type: 'number' },
            { key: 'quantityPending', label: 'Quantity Pending', type: 'number' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'quantityProduced', label: 'Total Items Produced' }, { column: 'quantityCompleted', label: 'Total Completed' }],
        },
      ],
    },
    {
      id: 'ministrySupply', title: '6. Ministry Supply & Distribution',
      fields: [
        {
          key: 'ministrySupply', type: 'table', label: 'Ministry Supply & Distribution',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'recipientDept', label: 'Recipient Department', type: 'select', options: ['Sonrise Primary School', 'Sonrise Nursery School', 'Children\'s Home', 'Baby Home', 'Guest House', 'Administration', 'Church', 'Medical Department', 'Farm Department', 'Staff', 'Other'] },
            { key: 'purpose', label: 'Purpose', type: 'text' },
            { key: 'receivedBy', label: 'Received By', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'quantity', label: 'Total Internal Supplies' }],
        },
      ],
    },
    {
      id: 'customerOrders', title: '7. Customer Orders & Sales',
      fields: [
        {
          key: 'customerOrders', type: 'table', label: 'Customer Orders & Sales',
          columns: [
            { key: 'customerName', label: 'Customer Name', type: 'text' },
            { key: 'category', label: 'Category', type: 'select', options: ['Community Customer', 'Staff', 'Ministry Department', 'School', 'Organization'] },
            { key: 'item', label: 'Item Ordered', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'unitPrice', label: 'Unit Price', type: 'number' },
            { key: 'totalAmount', label: 'Total Amount', type: 'number', readOnly: true, auto: (r) => (Number(r.quantity) || 0) * (Number(r.unitPrice) || 0) },
            { key: 'status', label: 'Order Status', type: 'select', options: ['Completed', 'In Progress', 'Pending'] },
            { key: 'deliveryDate', label: 'Delivery Date', type: 'date' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'totalAmount', label: 'Total Sales Income' }],
        },
      ],
    },
    {
      id: 'repairs', title: '8. Repairs & Alterations',
      fields: [
        {
          key: 'repairs', type: 'table', label: 'Repairs & Alterations',
          columns: [
            { key: 'customerDept', label: 'Customer/Department', type: 'text' },
            { key: 'item', label: 'Item', type: 'text' },
            { key: 'repairType', label: 'Repair Type', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'completed', label: 'Completed?', type: 'yesno' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'quantity', label: 'Total Repairs' }],
        },
      ],
    },
    {
      id: 'materials', title: '9. Fabric & Materials Inventory',
      fields: [
        {
          key: 'materials', type: 'table', label: 'Fabric & Materials Inventory',
          columns: [
            { key: 'material', label: 'Material', type: 'text' },
            { key: 'opening', label: 'Opening Stock', type: 'number' },
            { key: 'purchased', label: 'Purchased', type: 'number' },
            { key: 'donated', label: 'Received as Donation', type: 'number' },
            { key: 'used', label: 'Used', type: 'number' },
            { key: 'closing', label: 'Closing Balance', type: 'number', readOnly: true, auto: (r) => (Number(r.opening) || 0) + (Number(r.purchased) || 0) + (Number(r.donated) || 0) - (Number(r.used) || 0) },
            { key: 'unit', label: 'Unit', type: 'text' },
            { key: 'condition', label: 'Condition', type: 'text' },
            { key: 'reorderNeeded', label: 'Reorder Needed?', type: 'yesno' },
          ],
        },
      ],
    },
    {
      id: 'equipment', title: '10. Equipment & Machines',
      fields: [
        {
          key: 'equipment', type: 'table', label: 'Equipment & Machines',
          columns: [
            { key: 'equipment', label: 'Equipment', type: 'select', options: ['Sewing Machine', 'Overlock Machine', 'Embroidery Machine', 'Iron', 'Cutting Table', 'Measuring Equipment', 'Other'] },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'condition', label: 'Condition', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
            { key: 'operational', label: 'Operational?', type: 'yesno' },
            { key: 'needsRepair', label: 'Needs Repair?', type: 'yesno' },
            { key: 'replacementNeeded', label: 'Replacement Needed?', type: 'yesno' },
            { key: 'assignedUser', label: 'Assigned User', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
        },
      ],
    },
    {
      id: 'donations', title: '11. Donations Received',
      fields: [
        {
          key: 'donations', type: 'table', label: 'Donations Received',
          columns: [
            { key: 'date', label: 'Date', type: 'date' },
            { key: 'donor', label: 'Donor', type: 'text' },
            { key: 'item', label: 'Item Donated', type: 'text' },
            { key: 'quantity', label: 'Quantity', type: 'number' },
            { key: 'estimatedValue', label: 'Estimated Value', type: 'number' },
            { key: 'purpose', label: 'Purpose', type: 'text' },
            { key: 'remarks', label: 'Remarks', type: 'text' },
          ],
          totals: [{ column: 'estimatedValue', label: 'Total Donations Value' }],
        },
      ],
    },
    {
      id: 'financials', title: '12. Financial Summary',
      fields: [
        {
          key: 'income', type: 'table', label: 'Income',
          columns: [
            { key: 'source', label: 'Source', type: 'select', options: ['Garment Sales', 'Customer Orders', 'Repairs', 'Uniform Sales', 'Other Income'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Income' }],
        },
        {
          key: 'expenses', type: 'table', label: 'Expenses',
          columns: [
            { key: 'category', label: 'Category', type: 'select', options: ['Fabric', 'Thread', 'Machine Repairs', 'Equipment', 'Utilities', 'Transport', 'Other'] },
            { key: 'amount', label: 'Amount (UGX)', type: 'number' },
          ],
          totals: [{ column: 'amount', label: 'Total Expenditure' }],
        },
      ],
    },
    {
      id: 'skillsAssessment', title: '13. Skills Assessment',
      fields: [
        {
          key: 'skillsAssessment', type: 'table', label: 'Skills Assessment',
          columns: [
            { key: 'learner', label: 'Learner', type: 'text' },
            { key: 'skillArea', label: 'Skill Area', type: 'text' },
            { key: 'competencyLevel', label: 'Competency Level', type: 'select', options: ['Beginner', 'Developing', 'Competent', 'Excellent'] },
            { key: 'assessmentDate', label: 'Assessment Date', type: 'date' },
            { key: 'instructorComments', label: 'Instructor Comments', type: 'text' },
            { key: 'certificationRecommended', label: 'Certification Recommended?', type: 'yesno' },
          ],
          totals: [],
        },
      ],
    },
    {
      id: 'communityImpact', title: '14. Community Impact',
      fields: [
        { key: 'communityTrained', label: 'Community Members Trained', type: 'number' },
        { key: 'youthTrained', label: 'Youth Trained', type: 'number' },
        { key: 'womenEmpowered', label: 'Women Empowered', type: 'number' },
        { key: 'staffTrained', label: 'Staff Trained', type: 'number' },
        { key: 'businessStartups', label: 'Business Start-ups Supported', type: 'number' },
        { key: 'employmentCreated', label: 'Employment Opportunities Created', type: 'number' },
        {
          key: 'communityActivities', type: 'table', label: 'Community Outreach Activities',
          columns: [
            { key: 'activity', label: 'Activity', type: 'text' },
            { key: 'participants', label: 'Participants', type: 'number' },
            { key: 'outcome', label: 'Outcome', type: 'text' },
            { key: 'followUpNeeded', label: 'Follow-up Needed?', type: 'yesno' },
          ],
        },
      ],
    },
    {
      id: 'qualityAssurance', title: '15. Quality Assurance',
      fields: [
        { key: 'garmentQuality', label: 'Garment Quality', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'finishing', label: 'Finishing', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'timeliness', label: 'Timeliness', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'customerSatisfaction', label: 'Customer Satisfaction', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'machineMaintenance', label: 'Machine Maintenance', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'workshopCleanliness', label: 'Workshop Cleanliness', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'safetyPractices', label: 'Safety Practices', type: 'select', options: ['Excellent', 'Good', 'Fair', 'Poor'] },
        { key: 'qaComments', label: 'Comments', type: 'textarea' },
      ],
    },
    {
      id: 'challenges', title: '16. Challenges',
      fields: [
        { key: 'challenges', label: 'Training, production, equipment, material shortages, financial constraints, staffing, market challenges, recommendations', type: 'textarea' },
      ],
    },
    {
      id: 'nextMonth', title: '17. Priorities for Next Month',
      fields: [
        { key: 'nextMonthPlans', label: 'Training plans, production targets, purchases, machine repairs, community outreach, support required', type: 'textarea' },
      ],
    },
    {
      id: 'recommendations', title: '18. Recommendations',
      fields: [
        { key: 'recommendations', label: 'Recommendations to Executive Director, Finance, Procurement, ICT Department, School, Children\'s Home, HR, Donors', type: 'textarea' },
      ],
    },
    {
      id: 'declaration', title: '19. Declaration',
      fields: [
        { key: 'declName', label: 'Department Head', type: 'text', autoFill: 'submitterName', readOnly: true },
        { key: 'declDate', label: 'Date', type: 'date', autoFill: 'today', readOnly: true },
        { key: 'declConfirm', label: 'I confirm this report is accurate to the best of my knowledge', type: 'yesno' },
      ],
    },
  ],
};

// ---------------------------------------------------------------------
// Remaining departments — schemas to be added in the same shape as above.
// Marked comingSoon so the app runs correctly today and each one can be
// dropped in later without touching any other file.
// ---------------------------------------------------------------------
const stub = (slug, title) => ({ slug, title, comingSoon: true, sections: [], dashboard: [] });

const SCHEMAS = {
  farm: FARM_SCHEMA,
  transport: TRANSPORT_SCHEMA,
  social_work: SOCIAL_WORK_SCHEMA,
  security: SECURITY_SCHEMA,
  childrens_home: CHILDRENS_HOME_SCHEMA,
  ict: ICT_SCHEMA,
  tailoring: TAILORING_SCHEMA,
  maintenance: MAINTENANCE_SCHEMA,
  medical: MEDICAL_SCHEMA,
  school: SCHOOL_SCHEMA,
  procurement: PROCUREMENT_SCHEMA,
  accounts: ACCOUNTS_SCHEMA,
};

window.SCHEMAS = SCHEMAS;

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

// ---------------------------------------------------------------------
// Remaining departments — schemas to be added in the same shape as above.
// Marked comingSoon so the app runs correctly today and each one can be
// dropped in later without touching any other file.
// ---------------------------------------------------------------------
const stub = (slug, title) => ({ slug, title, comingSoon: true, sections: [], dashboard: [] });

const SCHEMAS = {
  farm: FARM_SCHEMA,
  transport: stub('transport', 'Transport Department Monthly Report'),
  social_work: stub('social_work', 'Social Work Department Monthly Report'),
  security: stub('security', 'Security Department Monthly Report'),
  childrens_home: stub('childrens_home', 'Children\'s Home Department Monthly Report'),
  ict: stub('ict', 'ICT & Digital Services Department Monthly Report'),
  tailoring: stub('tailoring', 'Tailoring & Garment Production Monthly Report'),
  maintenance: stub('maintenance', 'Maintenance & Facilities Monthly Report'),
  medical: stub('medical', 'Medical / Clinic Monthly Report'),
  school: stub('school', 'School Department Monthly Report'),
  procurement: stub('procurement', 'Procurement & Stores Monthly Report'),
  accounts: stub('accounts', 'Accounts & Finance Monthly Report'),
};

window.SCHEMAS = SCHEMAS;

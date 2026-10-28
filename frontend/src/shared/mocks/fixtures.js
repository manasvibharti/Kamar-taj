// Mock fixtures for Kamar-Taj Refectory (MessMate)
export const MOCK_USERS = {
  student: {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'aarav.20214001@mnnit.ac.in',
    fullName: 'Aarav Sharma',
    role: 'STUDENT',
    rollNo: '20214001',
    dietaryPref: 'VEG',
    room: 'North Block, H-204',
  },
  staff: {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'staff@mnnit.ac.in',
    fullName: 'Wong (Mess Staff)',
    role: 'STAFF',
    rollNo: null,
    dietaryPref: 'VEG',
  },
  admin: {
    id: '33333333-3333-3333-3333-333333333333',
    email: 'admin@mnnit.ac.in',
    fullName: 'Ancient One (Mess Admin)',
    role: 'ADMIN',
    rollNo: null,
    dietaryPref: 'VEG',
  },
};

export const MOCK_SLOTS = [
  {
    id: 'slot-breakfast-01',
    mealDate: new Date().toISOString().split('T')[0],
    mealType: 'BREAKFAST',
    serviceStartAt: new Date(Date.now() - 3600000).toISOString(),
    serviceEndAt: new Date(Date.now() + 3600000).toISOString(),
    cancelCutoffAt: new Date(Date.now() - 7200000).toISOString(),
    state: 'SERVING',
    capacity: 250,
    mealFee: 30,
    menu: ['Poha', 'Banana', 'Masala Chai', 'Boiled Sprouts'],
    myBooking: { id: 'booking-b1', status: 'CHECKED_IN' },
  },
  {
    id: 'slot-lunch-02',
    mealDate: new Date().toISOString().split('T')[0],
    mealType: 'LUNCH',
    serviceStartAt: new Date(Date.now() + 7200000).toISOString(),
    serviceEndAt: new Date(Date.now() + 14400000).toISOString(),
    cancelCutoffAt: new Date(Date.now() + 3600000).toISOString(),
    state: 'OPEN',
    capacity: 250,
    mealFee: 60,
    menu: ['Rajma', 'Steamed Rice', 'Roti', 'Fresh Green Salad'],
    myBooking: { id: 'booking-l1', status: 'BOOKED' },
  },
  {
    id: 'slot-dinner-03',
    mealDate: new Date().toISOString().split('T')[0],
    mealType: 'DINNER',
    serviceStartAt: new Date(Date.now() + 25200000).toISOString(),
    serviceEndAt: new Date(Date.now() + 32400000).toISOString(),
    cancelCutoffAt: new Date(Date.now() + 18000000).toISOString(),
    state: 'OPEN',
    capacity: 250,
    mealFee: 60,
    menu: ['Paneer Butter Masala', 'Dal Tadka', 'Jeera Rice', 'Gulab Jamun'],
    myBooking: null,
  },
];

export const MOCK_STUDENT_EXPENSES = {
  monthlyBudget: 4500,
  consumedSpent: 2820,
  remainingBalance: 1680,
  totalGroceryPurchases: 68400,
  mealsConsumedCount: 57,
  activeOptInsToday: '2 of 3 meals',
  breakdown: [
    { name: 'Breakfasts', count: 20, rate: 30, total: 600 },
    { name: 'Lunches', count: 19, rate: 60, total: 1140 },
    { name: 'Dinners', count: 18, rate: 60, total: 1080 },
  ],
};


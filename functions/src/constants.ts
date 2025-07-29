// This file is a copy of the constants from the main app,
// required for the onUserCreate function to access MOCK_BADGES.
// In a production environment, this might be handled differently,
// e.g., by fetching badge definitions from another Firestore collection.

export const MOCK_BADGES: {id: string, name: string}[] = [
    {
        id: 'commendable_effort',
        name: 'Commendable Effort Badge',
    }
];

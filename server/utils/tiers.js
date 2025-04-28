"use strict";
module.exports = {
    0: {
        level: 0,
        name: "Basic Tier",
        users: 5,
        storage: 500 * 1024 * 1024,
        tickets: 50,
        forms: 2,
        api:false
    },
    1: {
        level: 1,
        name: "Silver Tier",
        users: 200,
        storage: 2 * 1024 * 1024 * 1024,
        tickets: 100,
        forms: 5,
        api:false
    },
    2: {
        level: 2,
        name: "Gold Tier",
        users: 1000,
        storage: 10 * 1024 * 1024 * 1024,
        tickets: 50,
        forms: 10,
        api:true
    },
    3: {
        level: 3,
        name: "Platinum Tier",
        users: 1000000,
        storage: 50 * 1024 * 1024 * 1024,
        tickets: 1000000,
        forms: 10000,
        api:true
    }
};

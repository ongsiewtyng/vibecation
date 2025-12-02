export interface FlightTicket {
    id: string;
    userId: string | null;
    airline: string;
    fromCode: string;
    fromCity: string;
    toCode: string;
    toCity: string;
    departureTime: string;
    arrivalTime: string;
    date: string;
    flightDate: string;
    seat: string;
    flightNumber: string;
    travelClass: string;
    passenger: string;
    bookingRef: string;
    gate?: string | null;
    terminal?: string | null;
    createdAt: string;
}

export const mockTickets: FlightTicket[] = [
    {
        id: "1",
        airline: "British Airways",
        fromCode: "LGW",
        fromCity: "London Gatwick",
        toCode: "CDG",
        toCity: "Paris Charles de Gaulle",
        departureTime: "07:25",
        arrivalTime: "09:45",

        // DATE FIELDS
        flightDate: "2023-09-07",       // ISO format for backend/formatting
        date: "07 SEP 2023",            // Display format

        seat: "3A",
        flightNumber: "BA108",
        travelClass: "LUXURY",
        passenger: "ADAM SMITH",
        bookingRef: "ZLE23Q",
        userId: "",
        createdAt: ""
    },

    {
        id: "2",
        airline: "British Airways",
        fromCode: "LHR",
        fromCity: "London Heathrow",
        toCode: "AMS",
        toCity: "Amsterdam Schiphol",
        departureTime: "13:10",
        arrivalTime: "15:35",

        // DATE FIELDS
        flightDate: "2023-11-12",
        date: "12 NOV 2023",

        seat: "18C",
        flightNumber: "BA412",
        travelClass: "ECONOMY PLUS",
        passenger: "ADAM SMITH",
        bookingRef: "K9X8LM",
        userId: "",
        createdAt: ""
    },

    {
        id: "3",
        airline: "Emirates",
        fromCode: "STN",
        fromCity: "London Stansted",
        toCode: "BCN",
        toCity: "Barcelona–El Prat",
        departureTime: "20:05",
        arrivalTime: "23:05",

        // DATE FIELDS
        flightDate: "2024-01-03",
        date: "03 JAN 2024",

        seat: "7F",
        flightNumber: "EK223",
        travelClass: "BUSINESS",
        passenger: "ADAM SMITH",
        bookingRef: "P4T7YU",
        userId: "",
        createdAt: ""
    }
];

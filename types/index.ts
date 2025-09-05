export interface Dictionary {
    header: {
        Wishlist: string;
        Cart: string;
        Profile: string;
        Login: string;
        Searchforproducts: string;
    };
}

export interface Session {
    user?: {
        id: string;
        email: string;
        name?: string;
    };
    expires: string;
}

export interface Banner {
    productId?: string;
    title: string;
    description: string;
    firstColor: string;
    imageUrl: string;
}

export interface Category {
    id: string;
    name: string;
    imageUrl: string;
}
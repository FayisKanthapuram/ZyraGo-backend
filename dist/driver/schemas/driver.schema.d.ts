import { Document } from 'mongoose';
export type DriverDocument = Driver & Document;
export declare class Driver {
    name: string;
    email: string;
    phone: string;
    password: string;
    licenseNumber: string;
    status: string;
    location: {
        lat: number;
        lng: number;
    };
}
export declare const DriverSchema: import("mongoose").Schema<Driver, import("mongoose").Model<Driver, any, any, any, (Document<unknown, any, Driver, any, import("mongoose").DefaultSchemaOptions> & Driver & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}) | (Document<unknown, any, Driver, any, import("mongoose").DefaultSchemaOptions> & Driver & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}), any, Driver>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Driver, Document<unknown, {}, Driver, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, {
    name?: import("mongoose").SchemaDefinitionProperty<string, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    email?: import("mongoose").SchemaDefinitionProperty<string, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    phone?: import("mongoose").SchemaDefinitionProperty<string, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    password?: import("mongoose").SchemaDefinitionProperty<string, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    licenseNumber?: import("mongoose").SchemaDefinitionProperty<string, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    status?: import("mongoose").SchemaDefinitionProperty<string, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
    location?: import("mongoose").SchemaDefinitionProperty<{
        lat: number;
        lng: number;
    }, Driver, Document<unknown, {}, Driver, {
        id: string;
    }, import("mongoose").DefaultSchemaOptions> & Omit<Driver & {
        _id: import("mongoose").Types.ObjectId;
    } & {
        __v: number;
    }, "id"> & {
        id: string;
    }> | undefined;
}, Driver>;

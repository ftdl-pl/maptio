import { Serializable } from "../interfaces/serializable.interface";

export class User implements Serializable<User> {

    /**
     * Unique Id (specific to Auth0 schema)
     */
    public user_id: string;

    /**
     * User name
     */
    public name: string;

    /**
     * User email
     */
    public email: string;

    /**
     * User picture URL
     */
    public picture: string;

    public constructor(init?: Partial<User>) {
        Object.assign(this, init);
    }


    static create(): User {
        return new User();
    }

    deserialize(input: any): User {
        if (!input.user_id) {
            return undefined;
        }
        let deserialized = new User();
        deserialized.name = input.name;
        deserialized.email = input.email;
        deserialized.picture = input.picture;
        deserialized.user_id = input.user_id; // specific to Auth0
        return deserialized;
    }

    tryDeserialize(input: any): [boolean, User] {
        try {
            let user = this.deserialize(input);
            if (user !== undefined) {
                return [true, user];
            }
            else {
                return [false, undefined]
            }
        }
        catch (Exception) {
            return [false, undefined]
        }
    }
}
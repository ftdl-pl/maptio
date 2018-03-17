import { Serializable } from "../interfaces/serializable.interface";
import * as shortid from "shortid";

/**
 * Represents a tag 
 */
export class Tag implements Serializable<Tag> {

    shortid: string;
    name: string;
    color: string;

    public constructor(init?: Partial<Tag>) {
        Object.assign(this, init);
    }

    create(name: string, color: string) {
        return new Tag({ name: name, color: color, shortid: shortid.generate() });
    }

    deserialize(input: any): Tag {
        if (!input) return
        let deserialized = new Tag();
        deserialized.name = input.name;
        deserialized.shortid = input.shortid;
        deserialized.color = input.color;
        return deserialized;
    }

    tryDeserialize(input: any): [boolean, Tag] {
        try {
            let tag = this.deserialize(input);
            if (tag !== undefined) {
                return [true, tag];
            }
            else {
                return [false, undefined]
            }
        }
        catch (Exception) {
            return [false, undefined]
        }
    };

}

export class SelectableTag extends Tag {

    public isSelected: boolean;

    public constructor(init?: Partial<SelectableTag>) {
        super()
        Object.assign(this, init);
    }
}


export const DEFAULT_TAGS = [
    new Tag({ name: "Green", color: "#4bb974", shortid: "SyevDuUfM" }),
    new Tag({ name: "Amber", color: "#eab126", shortid: "rJuuwd8Gz" }),
    new Tag({ name: "Red", color: "#e86942", shortid: "ByJtD_Lfz" }),
    new Tag({ name: "Not Started", color: "#857bb7", shortid: "rkvFDdLGf" }),
    new Tag({ name: "Dormant", color: "#b4b0b0", shortid: "S1yqP_8MG" }),
]
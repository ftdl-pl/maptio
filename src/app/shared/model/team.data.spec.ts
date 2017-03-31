
import { Team } from "./team.data";
import { Person } from "./person.data";

describe("Team Tests", () => {
    let team: Team;

    beforeEach(() => {
    });

    it("When members is empty, it creates new correctly", () => {
        team = new Team([]);
        expect(team.members.length).toBe(0);
    });

    it("Creates new correctly", () => {
        let person1 = new Person();
        person1.name = "member 1";
        let person2 = new Person();
        person2.name = "member 2"
        let person3 = new Person();
        person3.name = "member 3"

        team = new Team([person1, person2, person3]);

        expect(team.members.length).toBe(3);
    });
});
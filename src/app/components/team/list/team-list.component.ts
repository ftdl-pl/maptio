import { FormGroup, FormControl, Validators } from "@angular/forms";
import { Angulartics2Mixpanel } from "angulartics2";
import { Subscription } from "rxjs/Rx";
import { UserFactory } from "../../../shared/services/user.factory";
import { Component, OnInit } from "@angular/core";
import { TeamFactory } from "../../../shared/services/team.factory";
import { Auth } from "../../../shared/services/auth/auth.service";
import { User } from "../../../shared/model/user.data";
import { Team } from "../../../shared/model/team.data";
import { differenceBy, sortBy } from "lodash"
import { UserService } from "../../../shared/services/user/user.service";
import { Router } from "@angular/router";

@Component({
    selector: "team-list",
    templateUrl: "./team-list.component.html",
    styleUrls: ["./team-list-component.css"]
})

export class TeamListComponent implements OnInit {

    public user: User;
    public userSubscription2: Subscription;
    public userSubscription: Subscription;
    public teams$: Promise<Array<Team>>;
    public errorMessage: string;
    public isLoading: boolean;
    public isCreating: boolean;

    public createForm: FormGroup;
    public teamName: string;

    constructor(public auth: Auth, private teamFactory: TeamFactory, private userFactory: UserFactory,
        private userService: UserService, private analytics: Angulartics2Mixpanel, public router: Router) {
        this.userSubscription = this.auth.getUser().subscribe((user: User) => {
            this.user = user;
        });

        this.createForm = new FormGroup({
            "teamName": new FormControl(this.teamName, [
                Validators.required,
                Validators.minLength(2)
            ]),
        });


    }

    ngOnInit() {
        this.getTeams();
    }

    ngOnDestroy(): void {
        if (this.userSubscription2) this.userSubscription2.unsubscribe();
        if (this.userSubscription) this.userSubscription.unsubscribe();
    }


    createNewTeam() {
        // REFACTOR : this is not the right way to write then/catch
        if (this.createForm.dirty && this.createForm.valid) {
            let teamName = this.createForm.controls["teamName"].value;
            this.isCreating = true;
            this.teamFactory.create(new Team({ name: teamName, members: [this.user] }))
                .then((team: Team) => {
                    this.user.teams.push(team.team_id);
                    return this.userFactory.upsert(this.user)
                        .then((result: boolean) => {
                            if (result) {
                                this.getTeams();
                                this.teamName = ""
                                this.analytics.eventTrack("Create team", { email: this.user.email, name: teamName, teamId: team.team_id })
                            }
                            else {
                                throw `Unable to add you to team ${teamName}!`
                            }
                        },
                        () => { throw `Unable to create team ${teamName}!` })
                        .then(() => {
                            return { team_id: team.team_id, teamSlug: team.getSlug() }
                        })
                    // .catch((reason) => {
                    //     this.errorMessage = reason;
                    // })
                },
                () => { throw `Unable to create team ${teamName}!` })
                .then((team: { team_id: string, teamSlug: string }) => {
                    this.router.navigate(["teams", team.team_id, team.teamSlug])
                    this.isCreating = false;
                })
                .catch((reason) => {
                    // console.log(3, reason)
                    this.errorMessage = reason;
                    this.teamName = ""
                    this.isCreating = false;
                })

        }

    }


    getTeams() {
        this.isLoading = true;
        this.userSubscription2 = this.auth.getUser().subscribe(
            (user: User) => {

                this.teams$ =
                    this.teamFactory.get(user.teams)
                        .then((teams: Array<Team>) => {
                            teams.forEach(t => {
                                if (t) {
                                    this.userService.getUsersInfo(t.members).then((actualMembers: User[]) => {
                                        let allDeleted = differenceBy(t.members, actualMembers, m => m.user_id).map(m => { m.isDeleted = true; return m });
                                        return actualMembers.concat(allDeleted);
                                    })
                                        .then(members => t.members = sortBy(members, m => m.name))
                                }
                            })
                            return teams.filter(t => { return t !== undefined });
                        }, (r) => { this.isLoading = false; return Promise.reject(r) })
                        .then(teams => {
                            this.isLoading = false;
                            return sortBy(teams, t => t.name)
                        })
                        // .catch(() => { this.isLoading = false; })
            })
    }

    trackByMemberId(index: number, member: User) {
        return member.user_id;
    }

    trackByTeamId(index: number, team: Team) {
        return team.team_id;
    }

}
import { ErrorService } from "../error/error.service";
import { Router } from "@angular/router";
import { UserFactory } from "../user.factory";
import { Injectable } from "@angular/core";
import { tokenNotExpired } from "angular2-jwt";
import { UUID } from "angular2-uuid/index";
import { Observable } from "rxjs/Observable";
import { Subject } from "rxjs/Subject"
import "rxjs/add/operator/map";
import "rxjs/add/operator/toPromise";
import { User } from "../../model/user.data";
import { AuthConfiguration } from "./auth.config";

@Injectable()
export class Auth {

  private user$: Subject<User>;

  constructor(public lock: AuthConfiguration, public userFactory: UserFactory, private router: Router, private errorService: ErrorService) {

    this.user$ = new Subject();
    this.lock.getLock().on("authenticated", (authResult: any) => {
      localStorage.setItem("id_token", authResult.idToken);

      let pathname_object: any = JSON.parse(authResult.state);
      let pathname: any = localStorage.getItem(pathname_object.pathname_key) || "";
      localStorage.removeItem(pathname_object.pathname_key);

      this.lock.getLock().getProfile(authResult.idToken, (error: any, profile: any) => {
        if (error) {
          alert(error);
          return;
        }
        this.setUser(profile).then((isSucess: boolean) => {
          if (isSucess) {
            this.router.navigate([pathname], {})
              .catch((reason: any) => { errorService.handleError(reason) });
          }
          else {
            errorService.handleError("Something has gone wrong ! Try again ?");
          }
        });
        this.lock.getLock().hide();
      });

    });
  }

  public setUser(profile: any): Promise<boolean> {
    localStorage.setItem("profile", JSON.stringify(profile));

    return this.userFactory.get(profile.user_id)
      .then((user) => {
        this.user$.next(user);
        return Promise.resolve<boolean>(true);
      }).
      catch((reason: any) => {
        let user = User.create().deserialize(profile);
        this.userFactory.upsert(user)
          .then(() => { return Promise.resolve<boolean>(true); })
          .catch(() => { return Promise.resolve<boolean>(false); });  // adds the user in the database
        this.user$.next(user);
        return Promise.resolve<boolean>(true);
      });
  }



  public login() {
    let uuid = UUID.UUID();
    localStorage.setItem(uuid, localStorage.getItem("redirectUrl"));
    this.lock.getLock().show({
      auth: {
        params: {
          scope: "openid name email",
          state: JSON.stringify({ pathname_key: uuid })
        }
      }
    });
  };

  public authenticated() {
    return tokenNotExpired();
  }

  public logout() {
    localStorage.clear();
    this.clear();
  }

  public clear() {
    this.user$.next(undefined);
  }

  public getUser(): Observable<User> {
    let profileString = localStorage.getItem("profile");

    if (profileString) {
      this.userFactory.get(JSON.parse(profileString).user_id).then((user) => {
        this.user$.next(user)
      });
    }
    else {
      this.clear();
    }
    return this.user$.asObservable();
  }

}
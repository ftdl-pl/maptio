import { User } from "./../../model/user.data";
import { Injectable } from "@angular/core";
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, CanActivateChild } from "@angular/router";
import { Auth } from "../auth/auth.service";

@Injectable()
export class AuthGuard implements CanActivate, CanActivateChild {

    constructor(private auth: Auth, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {

        let url: string = state.url;

        if (this.auth.authenticated() && this.auth.authenticationProviderAuthenticated() && this.auth.internalApiAuthenticated()) {
            return true;
        }

        // if the session is over, lets clear all and start again
        localStorage.clear();

        localStorage.setItem("redirectUrl", url);
        this.router.navigate(["/login"]);
        return false;
    }

    canActivateChild(childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        return this.canActivate(childRoute, state)
    }
}

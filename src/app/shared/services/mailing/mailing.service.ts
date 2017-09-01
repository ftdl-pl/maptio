import { Http } from "@angular/http";
import { Injectable } from "@angular/core";
import { ErrorService } from "../error/error.service";

@Injectable()
export class MailingService {

    public client: any; // nodemailer.Transporter;

    private _http: Http;
    constructor(private http: Http, public errorService: ErrorService) {
        this._http = http;
    }

    public sendEmail(from: string, to: string[], subject: string, body: string): Promise<boolean> {

        let email = {
            from: from,
            subject: subject,
            body: body,
            to: to
        };

        return this.http.post("/api/v1/send", email)
            .map((responseData) => {
                return responseData.json();
            })
            .map((input: any) => {
                return input.MessageId !== undefined;
            })
            .toPromise()
            .then(r => r)
            .catch(this.errorService.handleError);
    }

    public sendInvitation(from: string, to: string[], subject: string, url: string, team: string): Promise<boolean> {

        let email = {
            from: from,
            subject: `You've been invited to join team "${team}" on Maptio`,
            url: url,
            to: to,
            team: team
        };

        return this.http.post("/api/v1/invite", email)
            .map((responseData) => {
                return responseData.json();
            })
            .map((input: any) => {
                return input.MessageId !== undefined;
            })
            .toPromise()
            .then(r => r)
            .catch(this.errorService.handleError);
    }
}
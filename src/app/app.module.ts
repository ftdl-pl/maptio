
import { environment } from "./../environment/environment";

import { BrowserModule } from "@angular/platform-browser";
import { NgModule, Injector } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule, RequestOptions, XHRBackend, Http } from "@angular/http";

// Routing
import { PathLocationStrategy, Location, LocationStrategy } from "@angular/common";
import { Routes, RouterModule } from "@angular/router";

// Guards
import { AuthGuard } from "./shared/services/guards/auth.guard";
import { AccessGuard } from "./shared/services/guards/access.guard";

// Services
import { DataService } from "./shared/services/data.service";
import { DatasetFactory } from "./shared/services/dataset.factory";
import { ColorService } from "./shared/services/ui/color.service"
import { UIService } from "./shared/services/ui/ui.service"
import { ErrorService } from "./shared/services/error/error.service";
import { Auth } from "./shared/services/auth/auth.service";
import { AuthHttp, provideAuth } from "angular2-jwt";
import { UserFactory } from "./shared/services/user.factory";
import { TeamFactory } from "./shared/services/team.factory";
import { MailingService } from "./shared/services/mailing/mailing.service"
import { UserService } from "./shared/services/user/user.service";
import { LoaderService } from "./shared/services/loading/loader.service";

// Components
import { LoginComponent } from "./components/login/login.component";
import { HomeComponent } from "./components/home/home.component";
import { AppComponent } from "./components/app.component";
import { MappingComponent } from "./components/mapping/mapping.component";
import { MappingCirclesComponent } from "./components/mapping/circles/mapping.circles.component";
import { MappingTreeComponent } from "./components/mapping/tree/mapping.tree.component";
import { TooltipComponent } from "./components/mapping/tooltip/tooltip.component";
import { MemberSummaryComponent } from "./components/mapping/member-summary/member-summary.component";

import { InitiativeComponent } from "./components/initiative/initiative.component"
import { BuildingComponent } from "./components/building/building.component";
import { InitiativeNodeComponent } from "./components/building/initiative.node.component";

import { HelpComponent } from "./components/help/help.component";

import { AccountComponent } from "./components/account/account.component";
import { TeamComponent } from "./components/team/team.component";

import { WorkspaceComponent } from "./components/workspace/workspace.component";
import { FooterComponent } from "./components/footer/footer.component";
import { HeaderComponent } from "./components/header/header.component";

import { UnauthorizedComponent } from "./components/unauthorized/unauthorized.component";
import { NotFoundComponent } from "./components/unauthorized/not-found.component";
import { DashboardComponent } from "./components/dashboard/dashboard.component";
import { SignupComponent } from "./components/login/signup.component";

// Analytics
import { Angulartics2Mixpanel, Angulartics2Module } from "angulartics2";

// Directives
import { FocusIfDirective } from "./shared/directives/focusif.directive";
import { AutoSelectDirective } from "./shared/directives/autoselect.directive"
import { AnchorDirective } from "./shared/directives/anchor.directive"

// External libraries
import { MarkdownModule, MarkdownService } from "angular2-markdown";
import { FileUploadModule } from "ng2-file-upload";
import { CloudinaryModule } from "@cloudinary/angular-4.x";
import { Cloudinary } from "cloudinary-core";
import { D3Service } from "d3-ng2-service";
import { TreeModule } from "angular-tree-component";
import { Ng2Bs3ModalModule } from "ng2-bs3-modal/ng2-bs3-modal";
import { NgbModule } from "@ng-bootstrap/ng-bootstrap";
import { AuthConfiguration } from "./shared/services/auth/auth.config";
import { ResponsiveModule, } from "ng2-responsive";
import { ConfirmationPopoverModule } from "angular-confirmation-popover";
import { JwtEncoder } from "./shared/services/encoding/jwt.service";
// import { HttpService } from "./shared/services/http/http.service";
// import { HttpServiceFactory } from "./shared/services/http/htttp.service.factory";
import { TeamsListComponent } from "./components/team/teams-list.component";
import { authHttpServiceFactory } from "./shared/services/auth/auth.module";
import { ChangePasswordComponent } from "./components/login/change-password.component";
import { AnAnchorableComponent } from "../test/specs/shared/component.helper.shared";
import { MappingNetworkComponent } from "./components/mapping/network/mapping.network.component";
import { LoaderComponent } from "./components/loading/loader.component";

// Routes
const appRoutes: Routes = [
  { path: "", redirectTo: "", pathMatch: "full", component: HomeComponent },

  { path: "home", component: HomeComponent },

  { path: "login", component: LoginComponent },
  { path: "help", component: HelpComponent },
  { path: "signup", component: SignupComponent },

  { path: "teams", component: TeamsListComponent, canActivate: [AuthGuard] },
  { path: "team/:teamid/:slug", component: TeamComponent, canActivate: [AuthGuard, AccessGuard] },

  { path: ":shortid/:slug", component: AccountComponent, canActivate: [AuthGuard] },

  { path: "map/:mapid/:slug", component: WorkspaceComponent, canActivate: [AuthGuard, AccessGuard], canActivateChild: [AuthGuard, AccessGuard] },
  { path: "map/:mapid/:mapslug/i/:nodeid/:nodeslug", component: WorkspaceComponent, canActivate: [AuthGuard, AccessGuard], canActivateChild: [AuthGuard, AccessGuard] },
  { path: "map/:mapid/:mapslug/:layout", component: WorkspaceComponent, canActivate: [AuthGuard, AccessGuard], canActivateChild: [AuthGuard, AccessGuard] },

  { path: "summary/map/:mapid/:mapslug/u/:usershortid/:userslug", component: MemberSummaryComponent, canActivate: [AuthGuard, AccessGuard], canActivateChild: [AuthGuard, AccessGuard] },

  { path: "unauthorized", component: UnauthorizedComponent },
  { path: "forgot", component: ChangePasswordComponent },
  { path: "404", component: NotFoundComponent },
  { path: "**", redirectTo: "/404" }
];

export const cloudinaryLib = {
  Cloudinary: Cloudinary
};

export function markdownServiceFactory(http: Http) {
  let _markdown = new MarkdownService(http)
  _markdown.setMarkedOptions({ breaks: true })
  _markdown.renderer.link = (href: string, title: string, text: string) => {
    return `<a href=${href} class="markdown-link" target="_blank" title=${title}>${text}</a>`;
  }
  return _markdown
}

@NgModule({
  declarations: [
    AppComponent, AccountComponent, HeaderComponent, FooterComponent, WorkspaceComponent, TeamComponent,
    MappingComponent, MappingCirclesComponent, MappingTreeComponent, MemberSummaryComponent, MappingNetworkComponent, TooltipComponent,
    BuildingComponent, InitiativeNodeComponent, LoginComponent, HomeComponent, UnauthorizedComponent, NotFoundComponent,
    InitiativeComponent, ChangePasswordComponent, LoaderComponent, TeamsListComponent, SignupComponent,
    FocusIfDirective,
    AutoSelectDirective,
    AnchorDirective,
    HelpComponent,
    DashboardComponent,

    // for tests
    AnAnchorableComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    HttpModule,
    TreeModule,
    Ng2Bs3ModalModule,
    NgbModule.forRoot(),
    RouterModule.forRoot(appRoutes),
    ResponsiveModule,
    ConfirmationPopoverModule.forRoot({
      confirmButtonType: "danger"
    }),
    MarkdownModule.forRoot(),
    Angulartics2Module.forRoot([Angulartics2Mixpanel]),
    FileUploadModule,
    CloudinaryModule.forRoot(cloudinaryLib, { cloud_name: environment.CLOUDINARY_CLOUDNAME, upload_preset: environment.CLOUDINARY_UPLOAD_PRESET })
  ],
  exports: [RouterModule],
  providers: [
    AuthGuard, AccessGuard, AuthConfiguration,
    D3Service, DataService, ColorService, UIService, DatasetFactory, TeamFactory,
    ErrorService, Auth, UserService, UserFactory, MailingService, JwtEncoder, LoaderService,
    Location,
    { provide: LocationStrategy, useClass: PathLocationStrategy },
    // {
    //   provide: Http,
    //   useFactory: HttpServiceFactory,
    //   deps: [XHRBackend, RequestOptions, LoaderService, ErrorService]
    // },
    {
      provide: AuthHttp,
      useFactory: authHttpServiceFactory,
      deps: [Http, RequestOptions]
    },
    {
      provide: MarkdownService,
      useFactory: markdownServiceFactory,
      deps: [Http]
    }
  ],
  entryComponents: [AppComponent],
  bootstrap: [AppComponent]
})

export class AppModule {

}

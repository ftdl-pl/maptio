import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpComponent } from './help/help.component';
import { PricingComponent } from './pricing/pricing.component';
import { CheckoutComponent } from './pricing/checkout.component';
// import { PrivacyComponent } from '../../modules/legal/pages/privacy/privacy.page';
// import { TermsComponent } from '../../modules/legal/pages/tos/terms.page';
import { Routes, RouterModule } from '@angular/router';
import { AuthGuard } from '../../core/guards/auth.guard';


const routes: Routes = [
    {
        path: "",
        children: [

            { path: "help", component: HelpComponent, data: { breadcrumbs: true, text: "Help" } },
            { path: "pricing", component: PricingComponent, data: { breadcrumbs: true, text: "Pricing" } },
            { path: "checkout", canActivate: [AuthGuard], component: CheckoutComponent },

            // { path: "terms", component: TermsComponent, data: { breadcrumbs: true, text: "Terms of service" } },

            // { path: "privacy", component: PrivacyComponent, data: { breadcrumbs: true, text: "Privacy policy" } },

        ]

    }
];



@NgModule({
    declarations: [
        HelpComponent,
        PricingComponent,
        CheckoutComponent
    ],
    imports: [
        CommonModule,

        RouterModule.forChild(routes)],
    providers: [],
})
export class CompanyModule { }
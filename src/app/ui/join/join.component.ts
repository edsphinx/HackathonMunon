import { Component, OnInit } from '@angular/core';
import { ContractService } from './../../services/contract/contract.service';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { MdcSnackbar } from '@angular-mdc/web';
import { MdcSelectModule } from '@angular-mdc/web';

type JoinField = 'sendaddress' | 'hackathonId';
type FormErrors = {[u in JoinField]: string};
@Component({
  selector: 'app-join',
  templateUrl: './join.component.html',
  styleUrls: ['./join.component.scss']
})
export class JoinComponent implements OnInit {
  direction: string;
  address: string;
  hackathonId: string;
  balance: string;
  success: boolean;
  joinDone: boolean;
  joinForm: FormGroup;
  formErrors: FormErrors = {
    sendaddress: '',
    hackathonId: '',
  };
  validationMessages = {
   sendaddress: {
   required: 'The send address is required ',
   pattern: 'that´s no looks like a valid address',
   minlength: 'a address must have much than 40 characters',

   },
   hackathonId: {
     required: 'Need a hackathon id to join',
     pattern: 'Only support numbers',
   },
  };

// tslint:disable-next-line: no-shadowed-variable
  constructor(private frb: FormBuilder, private contract: ContractService, private snackbar: MdcSnackbar) {
   contract.seeAccountInfo().then((value: any) => {
      this.direction = value.originAccount;
      this.balance = value.balance;
    }).catch((error: any) => {
      contract.failure('Could\'t get the account data, please check if metamask is running correctly and refresh the page');
    });
  }

  ngOnInit() {
    this.buildForm();
  }

  buildForm() {
    this.joinForm = this.frb.group({
      sendaddress: ['', [
          Validators.required,
          Validators.minLength(42),
        ]
      ],
      hackathonId : [''],
    });
    this.joinForm.valueChanges.subscribe((data) => this.onValueChanged(data));
    this.onValueChanged();
  }

  reset() {
    this.joinForm.reset();
  }

  joinHackathon(e) {
    this.hackathonId = this.joinForm.value.hackathonId;
    this.contract.joinHackathonService(this.direction, this.hackathonId).then((r) => {
      const hackathon_id = r['logs'][0].args['hackathon_id'].words[0];
      const participant_addr = r['logs'][0].args['participant_addr'];
      this.contract.printSnackbarMessage('Success! Your address is: ' + participant_addr + ' and registered to hackathon ' + hackathon_id);
      console.log(r);
    }).catch((e) => {
      this.contract.failure('Join failed');
    });
  }

  navigateTo() {
    window.open('https://metamask.io/');
  }

  onValueChanged(data?: any) {
    if (!this.joinForm) { return; }
    const form = this.joinForm;
    for (const field in this.formErrors) {
      if (Object.prototype.hasOwnProperty.call(this.formErrors, field) && (field === 'sendaddress' || field === 'hackathonId')) {
        this.formErrors[field] = '';
        const control = form.get(field);
        if (control && control.dirty && !control.valid) {
          const messages = this.validationMessages[field];
          if (control.errors) {
            for (const key in control.errors) {
              if (Object.prototype.hasOwnProperty.call(control.errors, key) ) {
                this.formErrors[field] += `${(messages as {[key: string]: string})[key]} `;
              }
            }
          }
        }
      }
    }
  }
}

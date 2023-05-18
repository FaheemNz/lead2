import { LightningElement } from 'lwc';
import getLeadOptions from '@salesforce/apex/Lead2Controller.getLeadOptions';
import saveFormData from '@salesforce/apex/Lead2Controller.saveFormData';
import sendErrorEmail from "@salesforce/apex/Lead2Controller.sendErrorEmail";
import { loadScript } from 'lightning/platformResourceLoader';
import KioskPhoneLibrary from '@salesforce/resourceUrl/KioskPhoneLibrary';

export default class ContactForm extends LightningElement {
    firstName;
    lastName;
    email;
    preferredProject;
    language;
    mobile;
    selectedLocationValue;
    notes;
    selectedDirectPcNameOptions;
    languageOptions;
    selectedLanguageValue;
    promoterOptions;
    selectedPromoterValue;
    nationalityOptions;
    selectedNationalityValue;
    countryOfResidenceOptions;
    selectedCountryOfResidenceValue;
    selectedMobileCountryCode;
    mobileCountryCodeOptions;
    locationOptions;
    selectedAlternateMobileCountryCode;
    tableMeetingOptions;
    selectedTableMeetingOption;
    alternateMobile;
    isLoading = false;
    isLocationSelected = true;
    isLeadCreated = false;
    isLibraryLoaded = false;

    renderedCallback(){
        if(!this.isLibraryLoaded){
            loadScript(this, KioskPhoneLibrary)
                .then(response => {
                    this.isLibraryLoaded = true;
                    console.log("Phone Validation Loaded");
                })
                .catch(error => {
                    console.log("Phone Validation Error");
                    console.log(error);
                });
        }
    }
 
    connectedCallback(){
        this.isLoading = true;

        getLeadOptions()
            .then(response => {
                this.directPcNameOptions = response.directPcNames;
                this.languageOptions = response.languages;
                this.countryOfResidenceOptions = response.countriesOfResidence;
                this.nationalityOptions = response.nationalities;
                this.locationOptions = response.locations;
                this.mobileCountryCodeOptions = response.mobileCountryCodes;
                this.promoterOptions = response.promoters;
                this.tableMeetingOptions = [
                    { label: "Yes", value: "Yes" },
                    { label: "-", value: "-" }
                ];

                this.isLoading = false;
            })
            .catch(error => {
                console.log(error);
                this.sendError("Some Error Occured in connectedCallBack. Error: " + error);
                this.isLoading = false;
            });
    }

    handleInputChange(event){
        const field = event.target.name;
        const value = event.target.value;
        this[field] = value;
    }

    handleSelectChange(event){
        const field = event.target.name;
        const value = event.detail.value;
        this[field] = value;   
    }
    
    reloadPage(){
        window.location.reload(true);
    }

    get cssLocationClass(){
        return this.selectedLocationValue
            ? 'slds-theme_inverse isRounded'
            : '';
    }

    handleFormSubmit(event) {
        event.preventDefault();

        this.isLoading = true;

        let errorMessage = '';

        this.template.querySelectorAll('lightning-input, lightning-combobox, lightning-textarea').forEach(function(element) {
            if (!element.reportValidity()) {
                errorMessage = '* Please fill all the required fields';
            }
        });

        if( (this.selectedAlternateMobileCountryCode && !this.alternateMobile) || (this.alternateMobile && !this.selectedAlternateMobileCountryCode) ){
            errorMessage += '\n* Please fill Alternate Mobile Country Code details';
        }

        if( this.selectedMobileCountryCode && this.mobile ){
            const phoneNumberUtil = window.libphonenumber;
            
            let tempPhoneNumberCountryCode = this.selectedMobileCountryCode;

            tempPhoneNumberCountryCode = tempPhoneNumberCountryCode.replace(/\D/g, '');

            let mobile1 = phoneNumberUtil.parsePhoneNumber( "+" + tempPhoneNumberCountryCode + "" + this.mobile );
            
            if(!mobile1.isValid()){
                errorMessage += "\n* Please provide the Mobile Number in Correct Format";
            }
        }
        if( this.selectedAlternateMobileCountryCode && this.alternateMobile ){
            const phoneNumberUtil = window.libphonenumber;

            let tempPhoneNumberCountryCode2 = this.selectedAlternateMobileCountryCode;

            tempPhoneNumberCountryCode2 = tempPhoneNumberCountryCode2.replace(/\D/g, '');

            let mobile2 = phoneNumberUtil.parsePhoneNumber( "+" + tempPhoneNumberCountryCode2 + "" + this.alternateMobile );
            
            if(!mobile2.isValid()){
                errorMessage += "\n* Please provide the Alternate Mobile Number in Correct Format";
            }
        }

        if(errorMessage){
            alert(errorMessage);

            this.isLoading = false;

            return;
        }

        let formData = {
            firstName: this.firstName,
            lastName: this.lastName,
            email: this.email,
            mobileCountryCode: this.selectedMobileCountryCode,
            mobile: this.mobile,
            alternateMobile: this.alternateMobile,
            alternateMobileCountryCode: this.selectedAlternateMobileCountryCode,
            preferredProject: this.preferredProject,
            promoterName: this.selectedPromoterValue,
            notes: this.notes,
            language: this.selectedLanguageValue,
            nationality: this.selectedNationalityValue,
            countryOfResidence: this.selectedCountryOfResidenceValue,
            directPcName: this.selectedDirectPcNameOptions,
            location: this.selectedLocationValue,
            tableMeeting: this.selectedTableMeetingOption
        };

        saveFormData({formData})
            .then(response => {
                console.log(response);

                this.isLoading = false;

                if(response == true){
                    this.isLeadCreated = true;
                } else {
                    this.sendError("saveFormData returned false. FormData: " + JSON.stringify(formData));
                }
            })
            .catch(error => {
                this.sendError("saveFormData Exception; FormData: " + JSON.stringify(formData));

                console.log(error);

                this.isLoading = false;
            });
    }

    async sendError(message){
        await sendErrorEmail({message});
        
        alert("Some Error Occured. Please try again Later");
    }
}
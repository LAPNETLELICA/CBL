export const fcfa=(value:number)=>new Intl.NumberFormat("fr-FR").format(value).replace(/\u202f/g," ")+" FCFA";
export const shortDate=(value:string)=>new Intl.DateTimeFormat("fr-FR",{dateStyle:"medium",timeStyle:"short"}).format(new Date(value));

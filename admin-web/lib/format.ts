export const fcfa=(v:number)=>new Intl.NumberFormat("fr-FR").format(v).replace(/\u202f/g," ")+" FCFA";

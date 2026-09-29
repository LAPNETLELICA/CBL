insert into public.categories(slug,name,description,hero_image_url,accent,display_order) values
('chaussettes','Chaussettes & chaussons','Des petits pas bien au chaud.','/products/chaussettes-rose.webp','#9EDAF0',1),
('vetements','Vêtements bébé','Des tenues douces pour chaque journée.','/products/ensemble-douceur.webp','#FFB8CD',2),
('sommeil','Sommeil & literie','Tout pour des nuits paisibles.','/products/pyjama-tendre.webp','#B8CBEA',3),
('eveil','Jouets & éveil','Des découvertes à portée de main.','/products/eveil-doux.webp','#F7C77C',4),
('repas','Repas & alimentation','Des repas plus simples, des sourires en plus.','/products/coffret-repas.webp','#B4DDD1',5),
('bain','Bain & soin','Un cocon de soin au quotidien.','/products/kit-bain.webp','#F6D4B8',6),
('accessoires','Accessoires bébé','Les essentiels qui suivent la famille.','/products/sac-maternite.webp','#C7D2E9',7)
on conflict (slug) do nothing;

insert into public.products(category_id,slug,sku,name,description,price_fcfa,stock_quantity,age_group,size_label,gender,color,cover_image_url,featured,active)
select c.id, v.slug, v.sku, v.name, v.description, v.price, v.stock, v.age, v.size_label, v.gender, v.color, v.image, v.featured, true
from public.categories c
join (values
('vetements','ensemble-douceur-rose','CBL-1001','Ensemble Douceur rose','Combinaison, bonnet et gilet en maille souple.',18500,18,'0–6 mois','0–3 mois','Fille','Rose','/products/ensemble-douceur.webp',true),
('repas','coffret-premier-repas','CBL-1002','Coffret Premier repas','Set complet à compartiments, pensé pour les petites mains.',12500,15,'6–18 mois','Unique','Mixte','Ivoire','/products/coffret-repas.webp',true),
('accessoires','sac-maternite-week-end','CBL-1003','Sac maternité Week-end','Un ensemble spacieux pour garder chaque essentiel organisé.',32000,8,'Tous âges','Grand','Mixte','Gris','/products/sac-maternite.webp',true),
('bain','rituel-bain-complet','CBL-1004','Rituel de bain complet','Baignoire ergonomique et accessoires coordonnés.',38500,9,'0–18 mois','Unique','Mixte','Crème','/products/kit-bain.webp',true),
('chaussettes','chaussettes-noeud-rose','CBL-1005','Chaussettes Nœud rose','Trois paires délicates et confortables.',5500,30,'0–12 mois','0–6 mois','Fille','Rose','/products/chaussettes-rose.webp',false),
('chaussettes','chaussons-premiers-pas','CBL-1006','Chaussons Premiers pas','Une semelle souple et un maintien léger.',9500,14,'6–18 mois','18–20','Mixte','Bleu','/products/chaussons-bebe.webp',false),
('vetements','ensemble-nuage','CBL-1007','Ensemble Nuage','Un ensemble trois pièces moelleux pour les jours frais.',21000,12,'0–12 mois','6–9 mois','Mixte','Blanc','/products/ensemble-nuage.webp',false),
('vetements','robette-petit-lapin','CBL-1008','Robette Petit lapin','Robe légère avec bloomer coordonné.',14500,10,'6–18 mois','12 mois','Fille','Rose','/products/robette-lapin.webp',false),
('sommeil','pyjama-nuit-tendre','CBL-1009','Pyjama Nuit tendre','Coton respirant, coupe confortable et finitions douces.',11500,16,'2–5 ans','3 ans','Mixte','Bleu','/products/pyjama-tendre.webp',false),
('bain','cape-bain-douillette','CBL-1010','Cape de bain Douillette','Une sortie de bain enveloppante et absorbante.',8500,20,'0–24 mois','Unique','Mixte','Pastel','/products/cape-de-bain.webp',false),
('accessoires','valise-naissance','CBL-1011','Valise Naissance','Une valise rigide, compacte et facile à nettoyer.',27500,0,'Tous âges','Moyen','Mixte','Gris','/products/valise-bebe.webp',false),
('vetements','gilet-petit-marin','CBL-1012','Gilet Petit marin','Maille mi-saison à rayures bleu ciel.',13500,11,'12–36 mois','24 mois','Garçon','Bleu','/products/gilet-marin.webp',false)
) as v(category_slug,slug,sku,name,description,price,stock,age,size_label,gender,color,image,featured)
on c.slug = v.category_slug
on conflict (sku) do nothing;

insert into public.delivery_zones(name,delivery_window,fee_fcfa,display_order) values
('Centre-ville','Aujourd’hui ou demain',2000,1),
('Périphérie urbaine','1 à 2 jours',3500,2),
('Hors agglomération','2 à 4 jours',6000,3)
on conflict (name) do nothing;

insert into public.site_settings(key,value) values
('promo_banner','{"enabled":true,"title":"Petits prix, grandes attentions.","body":"Retrouvez les essentiels du quotidien à prix doux, dans la limite des stocks disponibles."}'::jsonb),
('home_message','{"title":"Tout pour les petits bonheurs.","body":"Des essentiels choisis avec tendresse pour accompagner les premiers jours."}'::jsonb),
('delivery_message','{"body":"Livraison claire, délais visibles et suivi de commande simple."}'::jsonb),
('store_contact','{"phone":"","email":"","whatsapp":""}'::jsonb)
on conflict (key) do nothing;

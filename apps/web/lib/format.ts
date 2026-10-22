const dateFormat = new Intl.DateTimeFormat("pt-PT", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Lisbon" });
export const formatDate = (iso: string) => dateFormat.format(new Date(iso));

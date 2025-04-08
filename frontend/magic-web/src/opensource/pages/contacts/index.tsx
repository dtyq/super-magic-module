import { RoutePath } from "@/const/routes"
import { Navigate } from "react-router"

function ContactsPage() {
	return <Navigate to={RoutePath.ContactsOrganization} />
}

export default ContactsPage

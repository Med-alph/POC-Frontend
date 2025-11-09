import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Stethoscope, User, Video, ArrowLeft } from "lucide-react"
import { appointmentsAPI } from "@/api/appointmentsapi"
import { patientsAPI } from "@/api/patientsapi"
import { toast } from "sonner"
import VideoCallPreview from "@/Consultation/VideoCallPreview"
import VideoRoom from "@/Consultation/VideoRoom"

const HOSPITAL_ID = "550e8400-e29b-41d4-a716-446655440001"

export default function PatientPortal() {
  const navigate = useNavigate()
  const location = useLocation()
  const { phone, patientId } = location.state || {}

  const [patient, setPatient] = useState(null)
  const [allAppointments, setAllAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("upcoming")

  // call join state
  const [previewOpen, setPreviewOpen] = useState(false)
  const [roomOpen, setRoomOpen] = useState(false)
  const [selectedAppointment, setSelectedAppointment] = useState(null)
  const [twilioToken, setTwilioToken] = useState(null)
  const [twilioRoom, setTwilioRoom] = useState(null)
  const [micPref, setMicPref] = useState(true)
  const [camPref, setCamPref] = useState(true)

  useEffect(() => {
    if (!phone) {
      toast.error("Please login to access your portal")
      navigate("/landing")
      return
    }

    const load = async () => {
      try {
        setLoading(true)
        let p = null
        if (patientId) {
          p = await patientsAPI.getById(patientId)
        } else {
          p = await patientsAPI.getByPhoneAndHospital(phone, HOSPITAL_ID)
        }
        if (!p || !p.id) {
          toast.error("Patient not found")
          navigate("/landing")
          return
        }
        setPatient(p)

        // fetch all appointments for patient
        const res = await appointmentsAPI.getByPatient(p.id, { limit: 100 })
        const list = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : []
        setAllAppointments(list)
      } catch (e) {
        console.error(e)
        toast.error("Failed to load portal")
        navigate("/landing")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [phone, patientId, navigate])

  const nowKey = useMemo(() => new Date().toISOString(), [])

  const upcomingAppointments = useMemo(() => {
    const now = new Date()
    return allAppointments.filter(a => {
      const d = new Date(`${a.appointment_date}T${(a.appointment_time || "00:00")}:00`)
      return d >= now && ["booked", "confirmed"].includes((a.status || '').toLowerCase())
    })
  }, [allAppointments])

  const pastAppointments = useMemo(() => {
    const now = new Date()
    return allAppointments.filter(a => {
      const d = new Date(`${a.appointment_date}T${(a.appointment_time || "00:00")}:00`)
      return d < now || ["completed", "cancelled"].includes((a.status || '').toLowerCase())
    })
  }, [allAppointments])

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })
    } catch { return dateString }
  }
  const formatTime = (timeString) => {
    try {
      const [h, m] = (timeString || "00:00").split(":")
      const d = new Date()
      d.setHours(parseInt(h || 0, 10)); d.setMinutes(parseInt(m || 0, 10))
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
    } catch { return timeString }
  }
  const StatusBadge = ({ status }) => {
    const s = (status || '').toLowerCase()
    const map = {
      booked: "bg-blue-100 text-blue-700",
      confirmed: "bg-green-100 text-green-700",
      completed: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    }
    const cls = map[s] || "bg-blue-100 text-blue-700"
    return <Badge className={cls}>{s ? s.charAt(0).toUpperCase()+s.slice(1) : 'Scheduled'}</Badge>
  }

  const handleJoinCall = async (appointment) => {
    try {
      const res = await appointmentsAPI.joinCall(appointment.id, patient?.id)
      const data = res?.data || res
      if (!data?.token || !data?.roomName) throw new Error("Invalid token")
      setTwilioToken(data.token)
      setTwilioRoom(data.roomName)
      setSelectedAppointment(appointment)
      setPreviewOpen(true)
    } catch (e) {
      toast.error(e.message || 'Unable to join call')
    }
  }

  const joinFromPreview = ({ micOn, camOn }) => {
    setMicPref(!!micOn)
    setCamPref(!!camOn)
    setPreviewOpen(false)
    setRoomOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your portal…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500 rounded-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Patient Portal</h1>
                <p className="text-sm text-gray-600">Welcome {patient?.patient_name || 'Patient'}</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate('/landing')} className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {patient && (
          <Card className="mb-6 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Patient Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold">{patient.patient_name || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold">{patient.contact_info || phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Age</p>
                  <p className="font-semibold">{patient.age || 'N/A'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-4">
            {upcomingAppointments.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="py-10 text-center text-gray-600">No upcoming appointments</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {upcomingAppointments.map(appt => (
                  <Card key={appt.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{appt.staff_name || appt.doctor_name || 'Doctor'}</h3>
                            <StatusBadge status={appt.status} />
                          </div>
                          <p className="text-sm text-gray-600">{appt.appointment_type || 'Consultation'}{appt.reason ? ` • ${appt.reason}` : ''}</p>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDate(appt.appointment_date)}</span>
                            <span className="flex items-center gap-2"><Clock className="h-4 w-4" />{formatTime(appt.appointment_time)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 md:w-auto w-full">
                          <Button className="bg-green-600 hover:bg-green-700 w-full md:w-auto" onClick={() => handleJoinCall(appt)}>
                            <Video className="h-4 w-4 mr-2" /> Join Call
                          </Button>
                          <Button variant="outline" className="w-full md:w-auto" onClick={() => toast.info('Details coming soon')}>Details</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-4">
            {pastAppointments.length === 0 ? (
              <Card className="shadow-sm">
                <CardContent className="py-10 text-center text-gray-600">No past appointments</CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {pastAppointments.map(appt => (
                  <Card key={appt.id} className="border-l-4 border-l-gray-400">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-3">
                            <h3 className="text-lg font-semibold">{appt.staff_name || appt.doctor_name || 'Doctor'}</h3>
                            <StatusBadge status={appt.status} />
                          </div>
                          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                            <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />{formatDate(appt.appointment_date)}</span>
                            <span className="flex items-center gap-2"><Clock className="h-4 w-4" />{formatTime(appt.appointment_time)}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 md:w-auto w-full">
                          <Button variant="outline" className="w-full md:w-auto" onClick={() => toast.info('Details coming soon')}>Details</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {previewOpen && selectedAppointment && (
        <VideoCallPreview
          open={previewOpen}
          onClose={() => {
            setPreviewOpen(false)
            setSelectedAppointment(null)
            setTwilioToken(null)
            setTwilioRoom(null)
          }}
          onJoin={joinFromPreview}
          appointmentId={selectedAppointment.id}
          initialMicOn={micPref}
          initialCamOn={camPref}
        />
      )}

      {roomOpen && twilioToken && twilioRoom && selectedAppointment && (
        <VideoRoom
          token={twilioToken}
          roomName={twilioRoom}
          appointmentId={selectedAppointment.id}
          micOnDefault={micPref}
          camOnDefault={camPref}
          onLeave={() => {
            setRoomOpen(false)
            setSelectedAppointment(null)
            setTwilioToken(null)
            setTwilioRoom(null)
          }}
        />
      )}
    </div>
  )
}


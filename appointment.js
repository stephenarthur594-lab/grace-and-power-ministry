import { supabase } from "./supabaseClient.js";

const form = document.getElementById("appointment-form");
const apSubmit = document.getElementById("ap_submit");
const apMsg = document.getElementById("ap_msg");

function setMessage(text, error=false){
  if(!apMsg) return;
  apMsg.textContent = text;
  apMsg.style.color = error ? "#ffb3b3" : "";
}

form.addEventListener("submit", async (e)=>{

  e.preventDefault();

  const name = form.querySelector("#ap_name").value.trim();
  const email = form.querySelector("#ap_email").value.trim();
  const phone = form.querySelector("#ap_phone").value.trim();
  const type = form.querySelector("#ap_type").value.trim();
  const date = form.querySelector("#ap_date").value;
  const time = form.querySelector("#ap_time").value;
  const message = form.querySelector("#ap_message").value.trim();

  if(!name || !email || !phone || !type || !date || !time){
    setMessage("Please fill all fields", true);
    return;
  }

  apSubmit.disabled = true;
  apSubmit.textContent = "Booking...";

  try{

    // Save to Supabase
    const { error } = await supabase
      .from("appointments")
      .insert([{
        name,
        email,
        phone,
        type,
        date,
        time,
        message
      }]);

    if(error) throw error;

    // Send Email Notification
    await emailjs.send(
      "service_abc123",      // replace
      "template_xyz456",     // replace
      {
        name,
        email,
        phone,
        type,
        date,
        time,
        message
      },
      "YOUR_PUBLIC_KEY"      // replace
    );

    form.reset();

    setMessage("Appointment booked successfully!");

  }catch(err){

    console.error(err);
    setMessage("Something went wrong.", true);

  }

  apSubmit.disabled = false;
  apSubmit.textContent = "Book Appointment";

});

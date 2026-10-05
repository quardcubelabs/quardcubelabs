"use client"

import React, { forwardRef } from "react"
import { CctvSiteSurvey } from "@/types/cctv"
import { ShieldCheck, Cctv, Building2, MapPin, Phone, Mail, CheckCircle2, XCircle } from "lucide-react"

interface CctvSurveyPrintProps {
  survey: CctvSiteSurvey
}

export const CctvSurveyPrint = forwardRef<HTMLDivElement, CctvSurveyPrintProps>(({ survey }, ref) => {
  return (
    <div ref={ref} className="p-8 text-black bg-white max-w-4xl mx-auto text-xs font-sans">
      {/* Header */}
      <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-black text-xl tracking-tight text-slate-900">QUARDCUBE SOLUTIONS</span>
            <span className="text-[10px] bg-slate-900 text-white font-bold px-2 py-0.5 rounded">CCTV ENGINEERING</span>
          </div>
          <p className="text-[11px] text-slate-600 font-medium mt-1">
            Official CCTV Site Survey & Technical Feasibility Report
          </p>
          <p className="text-[10px] text-slate-500">
            Dar es Salaam, Tanzania • info@quardcubelabs.co.tz • +255 623 893 383
          </p>
        </div>

        <div className="text-right">
          <div className="text-sm font-black font-mono text-slate-900">{survey.survey_number}</div>
          <div className="text-[10px] text-slate-500 font-semibold">
            Date: {new Date(survey.created_at).toLocaleDateString()}
          </div>
          <div className="text-[10px] font-bold text-slate-700 mt-1 uppercase">
            Status: {survey.status.replace(/_/g, ' ')}
          </div>
        </div>
      </div>

      {/* Customer & Site Details Grid */}
      <div className="grid grid-cols-2 gap-6 my-4 p-3 bg-slate-50 border border-slate-200 rounded">
        <div>
          <div className="font-bold text-[11px] uppercase tracking-wider text-slate-600 mb-1">Customer Details</div>
          <div className="font-black text-sm text-slate-900">{survey.customer_name}</div>
          <div className="text-slate-700">{survey.customer_email}</div>
          {survey.customer_phone && <div className="text-slate-700">Phone: {survey.customer_phone}</div>}
          {survey.customer_address && <div className="text-slate-600 text-[10px] mt-0.5">{survey.customer_address}</div>}
        </div>

        <div>
          <div className="font-bold text-[11px] uppercase tracking-wider text-slate-600 mb-1">Premises & Survey Site</div>
          <div className="font-black text-sm text-slate-900">{survey.site_name}</div>
          <div className="text-slate-700">{survey.site_address}</div>
          <div className="text-slate-600 text-[10px] mt-0.5">
            Building Type: <strong>{survey.building_type}</strong> • Environment: <strong>{survey.environment}</strong>
          </div>
          <div className="text-slate-600 text-[10px]">
            Buildings: {survey.number_of_buildings} • Floors: {survey.number_of_floors}
          </div>
        </div>
      </div>

      {/* Infrastructure & Network Checklist */}
      <div className="my-4">
        <div className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-2">
          Site Infrastructure & Power Checklist
        </div>
        <div className="grid grid-cols-3 gap-2 text-[11px]">
          <div className="p-2 border rounded bg-white">
            <span className="text-slate-500 block text-[10px]">Internet Connectivity:</span>
            <strong>{survey.internet_available ? `Yes (${survey.internet_speed_mbps || 20} Mbps)` : 'No'}</strong>
          </div>
          <div className="p-2 border rounded bg-white">
            <span className="text-slate-500 block text-[10px]">Mobile Remote Viewing:</span>
            <strong>{survey.remote_viewing_required ? 'Required (Hik-Connect)' : 'Not Required'}</strong>
          </div>
          <div className="p-2 border rounded bg-white">
            <span className="text-slate-500 block text-[10px]">Power & UPS Requirement:</span>
            <strong>{survey.ups_required ? 'Dedicated UPS Required' : 'Mains Only'}</strong>
          </div>
          <div className="p-2 border rounded bg-white">
            <span className="text-slate-500 block text-[10px]">Existing Network / Rack:</span>
            <strong>{survey.existing_network ? 'Present on Site' : 'New Setup Needed'}</strong>
          </div>
          <div className="p-2 border rounded bg-white">
            <span className="text-slate-500 block text-[10px]">Local Guardhouse Monitor:</span>
            <strong>{survey.monitor_required ? 'Required (HDMI TV)' : 'No Screen'}</strong>
          </div>
          <div className="p-2 border rounded bg-white">
            <span className="text-slate-500 block text-[10px]">Legacy CCTV Replacement:</span>
            <strong>{survey.existing_cctv ? 'Yes (Upgrade)' : 'Fresh Installation'}</strong>
          </div>
        </div>
      </div>

      {/* Camera Points Table */}
      <div className="my-4">
        <div className="font-bold text-xs uppercase tracking-wider text-slate-900 border-b pb-1 mb-2 flex items-center justify-between">
          <span>Camera Locations & Field Specifications ({survey.items?.length || 0} Points)</span>
          <span className="font-bold text-slate-700 font-mono text-[11px]">
            Est. Cabling: {survey.items?.reduce((s, i) => s + (i.estimated_cable_length_meters || 0), 0)}m
          </span>
        </div>

        <table className="w-full text-left border text-[10px]">
          <thead>
            <tr className="bg-slate-100 border-b font-bold text-slate-700 uppercase">
              <th className="p-2 w-8">#</th>
              <th className="p-2">Location & Coverage</th>
              <th className="p-2 w-24">Type</th>
              <th className="p-2 w-24">Resolution</th>
              <th className="p-2 w-24">Lens / Angle</th>
              <th className="p-2 w-28">Features</th>
              <th className="p-2 w-20 text-right">Cable (m)</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {(survey.items || []).map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="p-2 font-bold">{idx + 1}</td>
                <td className="p-2">
                  <strong className="text-slate-900">{item.location_name}</strong>
                  {item.coverage_notes && <p className="text-slate-500 text-[9px]">{item.coverage_notes}</p>}
                </td>
                <td className="p-2">{item.camera_type} ({item.indoor_outdoor})</td>
                <td className="p-2 font-semibold">{item.required_resolution}</td>
                <td className="p-2">{item.lens_requirement || '2.8mm Wide'}</td>
                <td className="p-2">
                  {[
                    item.colorvu_required && "ColorVu",
                    item.audio_required && "Audio Mic",
                    item.analytics_required && "AI AcuSense"
                  ].filter(Boolean).join(", ") || "Standard IR"}
                </td>
                <td className="p-2 text-right font-mono font-bold">{item.estimated_cable_length_meters}m</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Special Notes & Technician Signoff */}
      <div className="grid grid-cols-2 gap-6 my-6 pt-4 border-t">
        <div>
          <div className="font-bold text-[10px] uppercase text-slate-500">Technician Remarks</div>
          <p className="text-slate-700 text-[11px] mt-1 italic">
            {survey.notes || "Site inspection conducted according to standard QuardCube security engineering procedures."}
          </p>
        </div>

        <div className="text-right space-y-4">
          <div>
            <div className="font-bold text-[10px] uppercase text-slate-500">Surveyed By</div>
            <div className="font-bold text-slate-900 text-xs mt-0.5">{survey.technician_name || "QuardCube Lead Engineer"}</div>
          </div>
          <div className="pt-6">
            <div className="border-t border-slate-400 inline-block w-48 text-center text-[10px] text-slate-500">
              Technician Signature & Stamp
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

CctvSurveyPrint.displayName = "CctvSurveyPrint"

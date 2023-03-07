import { onChainReader } from '@shared/metadata';

describe('[on-chain-metadata-reader]', () => {
  it('should parse base64 string into valid metadata string', () => {
    const result = [
      // eslint-disable-next-line max-len
      onChainReader('data:application/json;base64,ewogICAgIm5hbWUiOiAiVGhvcidzIGhhbW1lciIsCiAgICAiZGVzY3JpcHRpb24iOiAiTWrDtmxuaXIsIHRoZSBsZWdlbmRhcnkgaGFtbWVyIG9mIHRoZSBOb3JzZSBnb2Qgb2YgdGh1bmRlci4iLAogICAgImltYWdlIjogImh0dHBzOi8vc3RhdGljLndpa2lhLm5vY29va2llLm5ldC9tYXJ2ZWxjaW5lbWF0aWN1bml2ZXJzZS9pbWFnZXMvMi8yNS9Nam9sbmlyLnBuZy9yZXZpc2lvbi9sYXRlc3Qvc2NhbGUtdG8td2lkdGgtZG93bi8zNTA/Y2I9MjAxNDAxMjkwMDEyNDQiLAogICAgInN0cmVuZ3RoIjogMjAKfQ=='),
      // eslint-disable-next-line max-len
      onChainReader('data:application/json;base64,eyJuYW1lIjoiVW5pc3dhcCAtIDAuMDUlIC0gVVNEVC9XRVRIIC0gMjA0OC44PD4zNzg1LjciLCAiZGVzY3JpcHRpb24iOiJUaGlzIE5GVCByZXByZXNlbnRzIGEgbGlxdWlkaXR5IHBvc2l0aW9uIGluIGEgVW5pc3dhcCBWMyBVU0RULVdFVEggcG9vbC4gVGhlIG93bmVyIG9mIHRoaXMgTkZUIGNhbiBtb2RpZnkgb3IgcmVkZWVtIHRoZSBwb3NpdGlvbi5cblxuUG9vbCBBZGRyZXNzOiAweDExYjgxNWVmYjhmNTgxMTk0YWU3OTAwNmQyNGUwZDgxNGI3Njk3ZjZcblVTRFQgQWRkcmVzczogMHhkYWMxN2Y5NThkMmVlNTIzYTIyMDYyMDY5OTQ1OTdjMTNkODMxZWM3XG5XRVRIIEFkZHJlc3M6IDB4YzAyYWFhMzliMjIzZmU4ZDBhMGU1YzRmMjdlYWQ5MDgzYzc1NmNjMlxuRmVlIFRpZXI6IDAuMDUlXG5Ub2tlbiBJRDogMTk5NDA2XG5cbuKaoO+4jyBESVNDTEFJTUVSOiBEdWUgZGlsaWdlbmNlIGlzIGltcGVyYXRpdmUgd2hlbiBhc3Nlc3NpbmcgdGhpcyBORlQuIE1ha2Ugc3VyZSB0b2tlbiBhZGRyZXNzZXMgbWF0Y2ggdGhlIGV4cGVjdGVkIHRva2VucywgYXMgdG9rZW4gc3ltYm9scyBtYXkgYmUgaW1pdGF0ZWQuIiwgImltYWdlIjogImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjNhV1IwYUQwaU1qa3dJaUJvWldsbmFIUTlJalV3TUNJZ2RtbGxkMEp2ZUQwaU1DQXdJREk1TUNBMU1EQWlJSGh0Ykc1elBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHlNREF3TDNOMlp5SWdlRzFzYm5NNmVHeHBibXM5SjJoMGRIQTZMeTkzZDNjdWR6TXViM0puTHpFNU9Ua3ZlR3hwYm1zblBqeGtaV1p6UGp4bWFXeDBaWElnYVdROUltWXhJajQ4Wm1WSmJXRm5aU0J5WlhOMWJIUTlJbkF3SWlCNGJHbHVhenBvY21WbVBTSmtZWFJoT21sdFlXZGxMM04yWnl0NGJXdzdZbUZ6WlRZMExGQklUakphZVVJellWZFNNR0ZFTUc1TmFtdDNTbmxDYjFwWGJHNWhTRkU1U25wVmQwMURZMmRrYld4c1pEQktkbVZFTUc1TlEwRjNTVVJKTlUxRFFURk5SRUZ1U1Vob2RHSkhOWHBRVTJSdlpFaFNkMDlwT0haa00yUXpURzVqZWt4dE9YbGFlVGg1VFVSQmQwd3pUakphZVdNclVFaEtiRmt6VVdka01teHJaRWRuT1VwNlNUVk5TRUkwU25sQ2IxcFhiRzVoU0ZFNVNucFZkMDFJUWpSS2VVSnRZVmQ0YzFCVFkycGFSMFpxVFZSa2JVcDVPQ3RRUXpsNlpHMWpLeUl2UGp4bVpVbHRZV2RsSUhKbGMzVnNkRDBpY0RFaUlIaHNhVzVyT21oeVpXWTlJbVJoZEdFNmFXMWhaMlV2YzNabkszaHRiRHRpWVhObE5qUXNVRWhPTWxwNVFqTmhWMUl3WVVRd2JrMXFhM2RLZVVKdldsZHNibUZJVVRsS2VsVjNUVU5qWjJSdGJHeGtNRXAyWlVRd2JrMURRWGRKUkVrMVRVTkJNVTFFUVc1SlNHaDBZa2MxZWxCVFpHOWtTRkozVDJrNGRtUXpaRE5NYm1ONlRHMDVlVnA1T0hsTlJFRjNURE5PTWxwNVl5dFFSMDV3WTIxT2MxcFRRbXBsUkRCdVRXcFZOVXA1UW1wbFZEQnVUVlJaZWtwNVFubFFVMk40VFdwQ2QyVkRZMmRhYld4ellrUXdia2t5VFhkTmJVWm9XVk5qZGxCcWQzWmpNMXB1VUdjOVBTSXZQanhtWlVsdFlXZGxJSEpsYzNWc2REMGljRElpSUhoc2FXNXJPbWh5WldZOUltUmhkR0U2YVcxaFoyVXZjM1puSzNodGJEdGlZWE5sTmpRc1VFaE9NbHA1UWpOaFYxSXdZVVF3YmsxcWEzZEtlVUp2V2xkc2JtRklVVGxLZWxWM1RVTmpaMlJ0Ykd4a01FcDJaVVF3YmsxRFFYZEpSRWsxVFVOQk1VMUVRVzVKU0doMFlrYzFlbEJUWkc5a1NGSjNUMms0ZG1RelpETk1ibU42VEcwNWVWcDVPSGxOUkVGM1RETk9NbHA1WXl0UVIwNXdZMjFPYzFwVFFtcGxSREJ1VFdwWk1rcDVRbXBsVkRCdVRrUk5NVXA1UW5sUVUyTjRUV3BDZDJWRFkyZGFiV3h6WWtRd2JrbDZaM3BOVjFacVRubGpkbEJxZDNaak0xcHVVR2M5UFNJZ0x6NDhabVZKYldGblpTQnlaWE4xYkhROUluQXpJaUI0YkdsdWF6cG9jbVZtUFNKa1lYUmhPbWx0WVdkbEwzTjJaeXQ0Yld3N1ltRnpaVFkwTEZCSVRqSmFlVUl6WVZkU01HRkVNRzVOYW10M1NubENiMXBYYkc1aFNGRTVTbnBWZDAxRFkyZGtiV3hzWkRCS2RtVkVNRzVOUTBGM1NVUkpOVTFEUVRGTlJFRnVTVWhvZEdKSE5YcFFVMlJ2WkVoU2QwOXBPSFprTTJRelRHNWpla3h0T1hsYWVUaDVUVVJCZDB3elRqSmFlV01yVUVkT2NHTnRUbk5hVTBKcVpVUXdiazFxVlhsS2VVSnFaVlF3YmsxcVNUSktlVUo1VUZOamVFMUVRbmRsUTJObldtMXNjMkpFTUc1SmVtTXhUbTFPYWsxcFkzWlFhbmQyWXpOYWJsQm5QVDBpSUM4K1BHWmxRbXhsYm1RZ2JXOWtaVDBpYjNabGNteGhlU0lnYVc0OUluQXdJaUJwYmpJOUluQXhJaUF2UGp4bVpVSnNaVzVrSUcxdlpHVTlJbVY0WTJ4MWMybHZiaUlnYVc0eVBTSndNaUlnTHo0OFptVkNiR1Z1WkNCdGIyUmxQU0p2ZG1WeWJHRjVJaUJwYmpJOUluQXpJaUJ5WlhOMWJIUTlJbUpzWlc1a1QzVjBJaUF2UGp4bVpVZGhkWE56YVdGdVFteDFjaUJwYmowaVlteGxibVJQZFhRaUlITjBaRVJsZG1saGRHbHZiajBpTkRJaUlDOCtQQzltYVd4MFpYSStJRHhqYkdsd1VHRjBhQ0JwWkQwaVkyOXlibVZ5Y3lJK1BISmxZM1FnZDJsa2RHZzlJakk1TUNJZ2FHVnBaMmgwUFNJMU1EQWlJSEo0UFNJME1pSWdjbms5SWpReUlpQXZQand2WTJ4cGNGQmhkR2crUEhCaGRHZ2dhV1E5SW5SbGVIUXRjR0YwYUMxaElpQmtQU0pOTkRBZ01USWdTREkxTUNCQk1qZ2dNamdnTUNBd0lERWdNamM0SURRd0lGWTBOakFnUVRJNElESTRJREFnTUNBeElESTFNQ0EwT0RnZ1NEUXdJRUV5T0NBeU9DQXdJREFnTVNBeE1pQTBOakFnVmpRd0lFRXlPQ0F5T0NBd0lEQWdNU0EwTUNBeE1pQjZJaUF2UGp4d1lYUm9JR2xrUFNKdGFXNXBiV0Z3SWlCa1BTSk5Nak0wSURRME5FTXlNelFnTkRVM0xqazBPU0F5TkRJdU1qRWdORFl6SURJMU15QTBOak1pSUM4K1BHWnBiSFJsY2lCcFpEMGlkRzl3TFhKbFoybHZiaTFpYkhWeUlqNDhabVZIWVhWemMybGhia0pzZFhJZ2FXNDlJbE52ZFhKalpVZHlZWEJvYVdNaUlITjBaRVJsZG1saGRHbHZiajBpTWpRaUlDOCtQQzltYVd4MFpYSStQR3hwYm1WaGNrZHlZV1JwWlc1MElHbGtQU0puY21Ga0xYVndJaUI0TVQwaU1TSWdlREk5SWpBaUlIa3hQU0l4SWlCNU1qMGlNQ0krUEhOMGIzQWdiMlptYzJWMFBTSXdMakFpSUhOMGIzQXRZMjlzYjNJOUluZG9hWFJsSWlCemRHOXdMVzl3WVdOcGRIazlJakVpSUM4K1BITjBiM0FnYjJabWMyVjBQU0l1T1NJZ2MzUnZjQzFqYjJ4dmNqMGlkMmhwZEdVaUlITjBiM0F0YjNCaFkybDBlVDBpTUNJZ0x6NDhMMnhwYm1WaGNrZHlZV1JwWlc1MFBqeHNhVzVsWVhKSGNtRmthV1Z1ZENCcFpEMGlaM0poWkMxa2IzZHVJaUI0TVQwaU1DSWdlREk5SWpFaUlIa3hQU0l3SWlCNU1qMGlNU0krUEhOMGIzQWdiMlptYzJWMFBTSXdMakFpSUhOMGIzQXRZMjlzYjNJOUluZG9hWFJsSWlCemRHOXdMVzl3WVdOcGRIazlJakVpSUM4K1BITjBiM0FnYjJabWMyVjBQU0l3TGpraUlITjBiM0F0WTI5c2IzSTlJbmRvYVhSbElpQnpkRzl3TFc5d1lXTnBkSGs5SWpBaUlDOCtQQzlzYVc1bFlYSkhjbUZrYVdWdWRENDhiV0Z6YXlCcFpEMGlabUZrWlMxMWNDSWdiV0Z6YTBOdmJuUmxiblJWYm1sMGN6MGliMkpxWldOMFFtOTFibVJwYm1kQ2IzZ2lQanh5WldOMElIZHBaSFJvUFNJeElpQm9aV2xuYUhROUlqRWlJR1pwYkd3OUluVnliQ2dqWjNKaFpDMTFjQ2tpSUM4K1BDOXRZWE5yUGp4dFlYTnJJR2xrUFNKbVlXUmxMV1J2ZDI0aUlHMWhjMnREYjI1MFpXNTBWVzVwZEhNOUltOWlhbVZqZEVKdmRXNWthVzVuUW05NElqNDhjbVZqZENCM2FXUjBhRDBpTVNJZ2FHVnBaMmgwUFNJeElpQm1hV3hzUFNKMWNtd29JMmR5WVdRdFpHOTNiaWtpSUM4K1BDOXRZWE5yUGp4dFlYTnJJR2xrUFNKdWIyNWxJaUJ0WVhOclEyOXVkR1Z1ZEZWdWFYUnpQU0p2WW1wbFkzUkNiM1Z1WkdsdVowSnZlQ0krUEhKbFkzUWdkMmxrZEdnOUlqRWlJR2hsYVdkb2REMGlNU0lnWm1sc2JEMGlkMmhwZEdVaUlDOCtQQzl0WVhOclBqeHNhVzVsWVhKSGNtRmthV1Z1ZENCcFpEMGlaM0poWkMxemVXMWliMndpUGp4emRHOXdJRzltWm5ObGREMGlNQzQzSWlCemRHOXdMV052Ykc5eVBTSjNhR2wwWlNJZ2MzUnZjQzF2Y0dGamFYUjVQU0l4SWlBdlBqeHpkRzl3SUc5bVpuTmxkRDBpTGprMUlpQnpkRzl3TFdOdmJHOXlQU0ozYUdsMFpTSWdjM1J2Y0MxdmNHRmphWFI1UFNJd0lpQXZQand2YkdsdVpXRnlSM0poWkdsbGJuUStQRzFoYzJzZ2FXUTlJbVpoWkdVdGMzbHRZbTlzSWlCdFlYTnJRMjl1ZEdWdWRGVnVhWFJ6UFNKMWMyVnlVM0JoWTJWUGJsVnpaU0krUEhKbFkzUWdkMmxrZEdnOUlqSTVNSEI0SWlCb1pXbG5hSFE5SWpJd01IQjRJaUJtYVd4c1BTSjFjbXdvSTJkeVlXUXRjM2x0WW05c0tTSWdMejQ4TDIxaGMycytQQzlrWldaelBqeG5JR05zYVhBdGNHRjBhRDBpZFhKc0tDTmpiM0p1WlhKektTSStQSEpsWTNRZ1ptbHNiRDBpWkdGak1UZG1JaUI0UFNJd2NIZ2lJSGs5SWpCd2VDSWdkMmxrZEdnOUlqSTVNSEI0SWlCb1pXbG5hSFE5SWpVd01IQjRJaUF2UGp4eVpXTjBJSE4wZVd4bFBTSm1hV3gwWlhJNklIVnliQ2dqWmpFcElpQjRQU0l3Y0hnaUlIazlJakJ3ZUNJZ2QybGtkR2c5SWpJNU1IQjRJaUJvWldsbmFIUTlJalV3TUhCNElpQXZQaUE4WnlCemRIbHNaVDBpWm1sc2RHVnlPblZ5YkNnamRHOXdMWEpsWjJsdmJpMWliSFZ5S1RzZ2RISmhibk5tYjNKdE9uTmpZV3hsS0RFdU5TazdJSFJ5WVc1elptOXliUzF2Y21sbmFXNDZZMlZ1ZEdWeUlIUnZjRHNpUGp4eVpXTjBJR1pwYkd3OUltNXZibVVpSUhnOUlqQndlQ0lnZVQwaU1IQjRJaUIzYVdSMGFEMGlNamt3Y0hnaUlHaGxhV2RvZEQwaU5UQXdjSGdpSUM4K1BHVnNiR2x3YzJVZ1kzZzlJalV3SlNJZ1kzazlJakJ3ZUNJZ2NuZzlJakU0TUhCNElpQnllVDBpTVRJd2NIZ2lJR1pwYkd3OUlpTXdNREFpSUc5d1lXTnBkSGs5SWpBdU9EVWlJQzgrUEM5blBqeHlaV04wSUhnOUlqQWlJSGs5SWpBaUlIZHBaSFJvUFNJeU9UQWlJR2hsYVdkb2REMGlOVEF3SWlCeWVEMGlORElpSUhKNVBTSTBNaUlnWm1sc2JEMGljbWRpWVNnd0xEQXNNQ3d3S1NJZ2MzUnliMnRsUFNKeVoySmhLREkxTlN3eU5UVXNNalUxTERBdU1pa2lJQzgrUEM5blBqeDBaWGgwSUhSbGVIUXRjbVZ1WkdWeWFXNW5QU0p2Y0hScGJXbDZaVk53WldWa0lqNDhkR1Y0ZEZCaGRHZ2djM1JoY25SUFptWnpaWFE5SWkweE1EQWxJaUJtYVd4c1BTSjNhR2wwWlNJZ1ptOXVkQzFtWVcxcGJIazlJaWREYjNWeWFXVnlJRTVsZHljc0lHMXZibTl6Y0dGalpTSWdabTl1ZEMxemFYcGxQU0l4TUhCNElpQjRiR2x1YXpwb2NtVm1QU0lqZEdWNGRDMXdZWFJvTFdFaVBqQjRZekF5WVdGaE16bGlNakl6Wm1VNFpEQmhNR1UxWXpSbU1qZGxZV1E1TURnell6YzFObU5qTWlEaWdLSWdWMFZVU0NBOFlXNXBiV0YwWlNCaFpHUnBkR2wyWlQwaWMzVnRJaUJoZEhSeWFXSjFkR1ZPWVcxbFBTSnpkR0Z5ZEU5bVpuTmxkQ0lnWm5KdmJUMGlNQ1VpSUhSdlBTSXhNREFsSWlCaVpXZHBiajBpTUhNaUlHUjFjajBpTXpCeklpQnlaWEJsWVhSRGIzVnVkRDBpYVc1a1pXWnBibWwwWlNJZ0x6NDhMM1JsZUhSUVlYUm9QaUE4ZEdWNGRGQmhkR2dnYzNSaGNuUlBabVp6WlhROUlqQWxJaUJtYVd4c1BTSjNhR2wwWlNJZ1ptOXVkQzFtWVcxcGJIazlJaWREYjNWeWFXVnlJRTVsZHljc0lHMXZibTl6Y0dGalpTSWdabTl1ZEMxemFYcGxQU0l4TUhCNElpQjRiR2x1YXpwb2NtVm1QU0lqZEdWNGRDMXdZWFJvTFdFaVBqQjRZekF5WVdGaE16bGlNakl6Wm1VNFpEQmhNR1UxWXpSbU1qZGxZV1E1TURnell6YzFObU5qTWlEaWdLSWdWMFZVU0NBOFlXNXBiV0YwWlNCaFpHUnBkR2wyWlQwaWMzVnRJaUJoZEhSeWFXSjFkR1ZPWVcxbFBTSnpkR0Z5ZEU5bVpuTmxkQ0lnWm5KdmJUMGlNQ1VpSUhSdlBTSXhNREFsSWlCaVpXZHBiajBpTUhNaUlHUjFjajBpTXpCeklpQnlaWEJsWVhSRGIzVnVkRDBpYVc1a1pXWnBibWwwWlNJZ0x6NGdQQzkwWlhoMFVHRjBhRDQ4ZEdWNGRGQmhkR2dnYzNSaGNuUlBabVp6WlhROUlqVXdKU0lnWm1sc2JEMGlkMmhwZEdVaUlHWnZiblF0Wm1GdGFXeDVQU0luUTI5MWNtbGxjaUJPWlhjbkxDQnRiMjV2YzNCaFkyVWlJR1p2Ym5RdGMybDZaVDBpTVRCd2VDSWdlR3hwYm1zNmFISmxaajBpSTNSbGVIUXRjR0YwYUMxaElqNHdlR1JoWXpFM1pqazFPR1F5WldVMU1qTmhNakl3TmpJd05qazVORFU1TjJNeE0yUTRNekZsWXpjZzRvQ2lJRlZUUkZRZ1BHRnVhVzFoZEdVZ1lXUmthWFJwZG1VOUluTjFiU0lnWVhSMGNtbGlkWFJsVG1GdFpUMGljM1JoY25SUFptWnpaWFFpSUdaeWIyMDlJakFsSWlCMGJ6MGlNVEF3SlNJZ1ltVm5hVzQ5SWpCeklpQmtkWEk5SWpNd2N5SWdjbVZ3WldGMFEyOTFiblE5SW1sdVpHVm1hVzVwZEdVaUlDOCtQQzkwWlhoMFVHRjBhRDQ4ZEdWNGRGQmhkR2dnYzNSaGNuUlBabVp6WlhROUlpMDFNQ1VpSUdacGJHdzlJbmRvYVhSbElpQm1iMjUwTFdaaGJXbHNlVDBpSjBOdmRYSnBaWElnVG1WM0p5d2diVzl1YjNOd1lXTmxJaUJtYjI1MExYTnBlbVU5SWpFd2NIZ2lJSGhzYVc1ck9taHlaV1k5SWlOMFpYaDBMWEJoZEdndFlTSStNSGhrWVdNeE4yWTVOVGhrTW1WbE5USXpZVEl5TURZeU1EWTVPVFExT1Rkak1UTmtPRE14WldNM0lPS0FvaUJWVTBSVUlEeGhibWx0WVhSbElHRmtaR2wwYVhabFBTSnpkVzBpSUdGMGRISnBZblYwWlU1aGJXVTlJbk4wWVhKMFQyWm1jMlYwSWlCbWNtOXRQU0l3SlNJZ2RHODlJakV3TUNVaUlHSmxaMmx1UFNJd2N5SWdaSFZ5UFNJek1ITWlJSEpsY0dWaGRFTnZkVzUwUFNKcGJtUmxabWx1YVhSbElpQXZQand2ZEdWNGRGQmhkR2crUEM5MFpYaDBQanhuSUcxaGMyczlJblZ5YkNnalptRmtaUzF6ZVcxaWIyd3BJajQ4Y21WamRDQm1hV3hzUFNKdWIyNWxJaUI0UFNJd2NIZ2lJSGs5SWpCd2VDSWdkMmxrZEdnOUlqSTVNSEI0SWlCb1pXbG5hSFE5SWpJd01IQjRJaUF2UGlBOGRHVjRkQ0I1UFNJM01IQjRJaUI0UFNJek1uQjRJaUJtYVd4c1BTSjNhR2wwWlNJZ1ptOXVkQzFtWVcxcGJIazlJaWREYjNWeWFXVnlJRTVsZHljc0lHMXZibTl6Y0dGalpTSWdabTl1ZEMxM1pXbG5hSFE5SWpJd01DSWdabTl1ZEMxemFYcGxQU0l6Tm5CNElqNVZVMFJVTDFkRlZFZzhMM1JsZUhRK1BIUmxlSFFnZVQwaU1URTFjSGdpSUhnOUlqTXljSGdpSUdacGJHdzlJbmRvYVhSbElpQm1iMjUwTFdaaGJXbHNlVDBpSjBOdmRYSnBaWElnVG1WM0p5d2diVzl1YjNOd1lXTmxJaUJtYjI1MExYZGxhV2RvZEQwaU1qQXdJaUJtYjI1MExYTnBlbVU5SWpNMmNIZ2lQakF1TURVbFBDOTBaWGgwUGp3dlp6NDhjbVZqZENCNFBTSXhOaUlnZVQwaU1UWWlJSGRwWkhSb1BTSXlOVGdpSUdobGFXZG9kRDBpTkRZNElpQnllRDBpTWpZaUlISjVQU0l5TmlJZ1ptbHNiRDBpY21kaVlTZ3dMREFzTUN3d0tTSWdjM1J5YjJ0bFBTSnlaMkpoS0RJMU5Td3lOVFVzTWpVMUxEQXVNaWtpSUM4K1BHY2diV0Z6YXowaWRYSnNLQ051YjI1bEtTSWdjM1I1YkdVOUluUnlZVzV6Wm05eWJUcDBjbUZ1YzJ4aGRHVW9Oekp3ZUN3eE9EbHdlQ2tpUGp4eVpXTjBJSGc5SWkweE5uQjRJaUI1UFNJdE1UWndlQ0lnZDJsa2RHZzlJakU0TUhCNElpQm9aV2xuYUhROUlqRTRNSEI0SWlCbWFXeHNQU0p1YjI1bElpQXZQanh3WVhSb0lHUTlJazB4SURGRE1TQTVOeUEwT1NBeE5EVWdNVFExSURFME5TSWdjM1J5YjJ0bFBTSnlaMkpoS0RBc01Dd3dMREF1TXlraUlITjBjbTlyWlMxM2FXUjBhRDBpTXpKd2VDSWdabWxzYkQwaWJtOXVaU0lnYzNSeWIydGxMV3hwYm1WallYQTlJbkp2ZFc1a0lpQXZQand2Wno0OFp5QnRZWE5yUFNKMWNtd29JMjV2Ym1VcElpQnpkSGxzWlQwaWRISmhibk5tYjNKdE9uUnlZVzV6YkdGMFpTZzNNbkI0TERFNE9YQjRLU0krUEhKbFkzUWdlRDBpTFRFMmNIZ2lJSGs5SWkweE5uQjRJaUIzYVdSMGFEMGlNVGd3Y0hnaUlHaGxhV2RvZEQwaU1UZ3djSGdpSUdacGJHdzlJbTV2Ym1VaUlDOCtQSEJoZEdnZ1pEMGlUVEVnTVVNeElEazNJRFE1SURFME5TQXhORFVnTVRRMUlpQnpkSEp2YTJVOUluSm5ZbUVvTWpVMUxESTFOU3d5TlRVc01Ta2lJR1pwYkd3OUltNXZibVVpSUhOMGNtOXJaUzFzYVc1bFkyRndQU0p5YjNWdVpDSWdMejQ4TDJjK1BHTnBjbU5zWlNCamVEMGlOek53ZUNJZ1kzazlJakU1TUhCNElpQnlQU0kwY0hnaUlHWnBiR3c5SW5kb2FYUmxJaUF2UGp4amFYSmpiR1VnWTNnOUlqSXhOM0I0SWlCamVUMGlNek0wY0hnaUlISTlJalJ3ZUNJZ1ptbHNiRDBpZDJocGRHVWlJQzgrSUR4bklITjBlV3hsUFNKMGNtRnVjMlp2Y20wNmRISmhibk5zWVhSbEtESTVjSGdzSURNNE5IQjRLU0krUEhKbFkzUWdkMmxrZEdnOUlqazRjSGdpSUdobGFXZG9kRDBpTWpad2VDSWdjbmc5SWpod2VDSWdjbms5SWpod2VDSWdabWxzYkQwaWNtZGlZU2d3TERBc01Dd3dMallwSWlBdlBqeDBaWGgwSUhnOUlqRXljSGdpSUhrOUlqRTNjSGdpSUdadmJuUXRabUZ0YVd4NVBTSW5RMjkxY21sbGNpQk9aWGNuTENCdGIyNXZjM0JoWTJVaUlHWnZiblF0YzJsNlpUMGlNVEp3ZUNJZ1ptbHNiRDBpZDJocGRHVWlQangwYzNCaGJpQm1hV3hzUFNKeVoySmhLREkxTlN3eU5UVXNNalUxTERBdU5pa2lQa2xFT2lBOEwzUnpjR0Z1UGpFNU9UUXdOand2ZEdWNGRENDhMMmMrSUR4bklITjBlV3hsUFNKMGNtRnVjMlp2Y20wNmRISmhibk5zWVhSbEtESTVjSGdzSURReE5IQjRLU0krUEhKbFkzUWdkMmxrZEdnOUlqRTBOM0I0SWlCb1pXbG5hSFE5SWpJMmNIZ2lJSEo0UFNJNGNIZ2lJSEo1UFNJNGNIZ2lJR1pwYkd3OUluSm5ZbUVvTUN3d0xEQXNNQzQyS1NJZ0x6NDhkR1Y0ZENCNFBTSXhNbkI0SWlCNVBTSXhOM0I0SWlCbWIyNTBMV1poYldsc2VUMGlKME52ZFhKcFpYSWdUbVYzSnl3Z2JXOXViM053WVdObElpQm1iMjUwTFhOcGVtVTlJakV5Y0hnaUlHWnBiR3c5SW5kb2FYUmxJajQ4ZEhOd1lXNGdabWxzYkQwaWNtZGlZU2d5TlRVc01qVTFMREkxTlN3d0xqWXBJajVOYVc0Z1ZHbGphem9nUEM5MGMzQmhiajR0TWpBd01EY3dQQzkwWlhoMFBqd3ZaejRnUEdjZ2MzUjViR1U5SW5SeVlXNXpabTl5YlRwMGNtRnVjMnhoZEdVb01qbHdlQ3dnTkRRMGNIZ3BJajQ4Y21WamRDQjNhV1IwYUQwaU1UUTNjSGdpSUdobGFXZG9kRDBpTWpad2VDSWdjbmc5SWpod2VDSWdjbms5SWpod2VDSWdabWxzYkQwaWNtZGlZU2d3TERBc01Dd3dMallwSWlBdlBqeDBaWGgwSUhnOUlqRXljSGdpSUhrOUlqRTNjSGdpSUdadmJuUXRabUZ0YVd4NVBTSW5RMjkxY21sbGNpQk9aWGNuTENCdGIyNXZjM0JoWTJVaUlHWnZiblF0YzJsNlpUMGlNVEp3ZUNJZ1ptbHNiRDBpZDJocGRHVWlQangwYzNCaGJpQm1hV3hzUFNKeVoySmhLREkxTlN3eU5UVXNNalUxTERBdU5pa2lQazFoZUNCVWFXTnJPaUE4TDNSemNHRnVQaTB4T1RNNU16QThMM1JsZUhRK1BDOW5QanhuSUhOMGVXeGxQU0owY21GdWMyWnZjbTA2ZEhKaGJuTnNZWFJsS0RJeU5uQjRMQ0EwTXpOd2VDa2lQanh5WldOMElIZHBaSFJvUFNJek5uQjRJaUJvWldsbmFIUTlJak0yY0hnaUlISjRQU0k0Y0hnaUlISjVQU0k0Y0hnaUlHWnBiR3c5SW01dmJtVWlJSE4wY205clpUMGljbWRpWVNneU5UVXNNalUxTERJMU5Td3dMaklwSWlBdlBqeHdZWFJvSUhOMGNtOXJaUzFzYVc1bFkyRndQU0p5YjNWdVpDSWdaRDBpVFRnZ09VTTRMakF3TURBMElESXlMamswT1RRZ01UWXVNakE1T1NBeU9DQXlOeUF5T0NJZ1ptbHNiRDBpYm05dVpTSWdjM1J5YjJ0bFBTSjNhR2wwWlNJZ0x6NDhZMmx5WTJ4bElITjBlV3hsUFNKMGNtRnVjMlp2Y20wNmRISmhibk5zWVhSbE0yUW9PSEI0TENBM2NIZ3NJREJ3ZUNraUlHTjRQU0l3Y0hnaUlHTjVQU0l3Y0hnaUlISTlJalJ3ZUNJZ1ptbHNiRDBpZDJocGRHVWlMejQ4TDJjK1BDOXpkbWMrIn0='),
      // eslint-disable-next-line max-len
      onChainReader('data:application/json;base64,ewogICAgIm5hbWUiOiAiU29tZSBjdXRlIHBlcnNvbiIsCiAgICAiZGVzY3JpcHRpb24iOiAiU29tZXdoZXJlIGZyb20gVWtyYWluZSIsCiAgICAiaW1hZ2UiOiAiaHR0cHM6Ly9saW5rLnVzMS5zdG9yanNoYXJlLmlvL2p3YWl6d3BnMzVyemVrbGl2bHJ6NG9yY2JtdmEvZGVtby1idWNrZXQlMkZBVkFUQVIuanBnIiwKICAgICJzdHJlbmd0aCI6IDIwCn0='),
      // eslint-disable-next-line max-len
      onChainReader('data:application/json;base64,eyJuYW1lIjoiVW5pc3dhcCAtIDAuMDUlIC0gVVNEVC9XRVRIIC0gMjA0OC44PD4zNzg1LjciLCAiZGVzY3JpcHRpb24iOiJUaGlzIE5GVCByZXByZXNlbnRzIGEgbGlxdWlkaXR5IHBvc2l0aW9uIGluIGEgVW5pc3dhcCBWMyBVU0RULVdFVEggcG9vbC4gVGhlIG93bmVyIG9mIHRoaXMgTkZUIGNhbiBtb2RpZnkgb3IgcmVkZWVtIHRoZSBwb3NpdGlvbi5cblxuUG9vbCBBZGRyZXNzOiAweDExYjgxNWVmYjhmNTgxMTk0YWU3OTAwNmQyNGUwZDgxNGI3Njk3ZjZcblVTRFQgQWRkcmVzczogMHhkYWMxN2Y5NThkMmVlNTIzYTIyMDYyMDY5OTQ1OTdjMTNkODMxZWM3XG5XRVRIIEFkZHJlc3M6IDB4YzAyYWFhMzliMjIzZmU4ZDBhMGU1YzRmMjdlYWQ5MDgzYzc1NmNjMlxuRmVlIFRpZXI6IDAuMDUlXG5Ub2tlbiBJRDogMTk5NDA2XG5cbuKaoO+4jyBESVNDTEFJTUVSOiBEdWUgZGlsaWdlbmNlIGlzIGltcGVyYXRpdmUgd2hlbiBhc3Nlc3NpbmcgdGhpcyBORlQuIE1ha2Ugc3VyZSB0b2tlbiBhZGRyZXNzZXMgbWF0Y2ggdGhlIGV4cGVjdGVkIHRva2VucywgYXMgdG9rZW4gc3ltYm9scyBtYXkgYmUgaW1pdGF0ZWQuIiwgImltYWdlIjogImRhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjNhV1IwYUQwaU1qa3dJaUJvWldsbmFIUTlJalV3TUNJZ2RtbGxkMEp2ZUQwaU1DQXdJREk1TUNBMU1EQWlJSGh0Ykc1elBTSm9kSFJ3T2k4dmQzZDNMbmN6TG05eVp5OHlNREF3TDNOMlp5SWdlRzFzYm5NNmVHeHBibXM5SjJoMGRIQTZMeTkzZDNjdWR6TXViM0puTHpFNU9Ua3ZlR3hwYm1zblBqeGtaV1p6UGp4bWFXeDBaWElnYVdROUltWXhJajQ4Wm1WSmJXRm5aU0J5WlhOMWJIUTlJbkF3SWlCNGJHbHVhenBvY21WbVBTSmtZWFJoT21sdFlXZGxMM04yWnl0NGJXdzdZbUZ6WlRZMExGQklUakphZVVJellWZFNNR0ZFTUc1TmFtdDNTbmxDYjFwWGJHNWhTRkU1U25wVmQwMURZMmRrYld4c1pEQktkbVZFTUc1TlEwRjNTVVJKTlUxRFFURk5SRUZ1U1Vob2RHSkhOWHBRVTJSdlpFaFNkMDlwT0haa00yUXpURzVqZWt4dE9YbGFlVGg1VFVSQmQwd3pUakphZVdNclVFaEtiRmt6VVdka01teHJaRWRuT1VwNlNUVk5TRUkwU25sQ2IxcFhiRzVoU0ZFNVNucFZkMDFJUWpSS2VVSnRZVmQ0YzFCVFkycGFSMFpxVFZSa2JVcDVPQ3RRUXpsNlpHMWpLeUl2UGp4bVpVbHRZV2RsSUhKbGMzVnNkRDBpY0RFaUlIaHNhVzVyT21oeVpXWTlJbVJoZEdFNmFXMWhaMlV2YzNabkszaHRiRHRpWVhObE5qUXNVRWhPTWxwNVFqTmhWMUl3WVVRd2JrMXFhM2RLZVVKdldsZHNibUZJVVRsS2VsVjNUVU5qWjJSdGJHeGtNRXAyWlVRd2JrMURRWGRKUkVrMVRVTkJNVTFFUVc1SlNHaDBZa2MxZWxCVFpHOWtTRkozVDJrNGRtUXpaRE5NYm1ONlRHMDVlVnA1T0hsTlJFRjNURE5PTWxwNVl5dFFSMDV3WTIxT2MxcFRRbXBsUkRCdVRXcFZOVXA1UW1wbFZEQnVUVlJaZWtwNVFubFFVMk40VFdwQ2QyVkRZMmRhYld4ellrUXdia2t5VFhkTmJVWm9XVk5qZGxCcWQzWmpNMXB1VUdjOVBTSXZQanhtWlVsdFlXZGxJSEpsYzNWc2REMGljRElpSUhoc2FXNXJPbWh5WldZOUltUmhkR0U2YVcxaFoyVXZjM1puSzNodGJEdGlZWE5sTmpRc1VFaE9NbHA1UWpOaFYxSXdZVVF3YmsxcWEzZEtlVUp2V2xkc2JtRklVVGxLZWxWM1RVTmpaMlJ0Ykd4a01FcDJaVVF3YmsxRFFYZEpSRWsxVFVOQk1VMUVRVzVKU0doMFlrYzFlbEJUWkc5a1NGSjNUMms0ZG1RelpETk1ibU42VEcwNWVWcDVPSGxOUkVGM1RETk9NbHA1WXl0UVIwNXdZMjFPYzFwVFFtcGxSREJ1VFdwWk1rcDVRbXBsVkRCdVRrUk5NVXA1UW5sUVUyTjRUV3BDZDJWRFkyZGFiV3h6WWtRd2JrbDZaM3BOVjFacVRubGpkbEJxZDNaak0xcHVVR2M5UFNJZ0x6NDhabVZKYldGblpTQnlaWE4xYkhROUluQXpJaUI0YkdsdWF6cG9jbVZtUFNKa1lYUmhPbWx0WVdkbEwzTjJaeXQ0Yld3N1ltRnpaVFkwTEZCSVRqSmFlVUl6WVZkU01HRkVNRzVOYW10M1NubENiMXBYYkc1aFNGRTVTbnBWZDAxRFkyZGtiV3hzWkRCS2RtVkVNRzVOUTBGM1NVUkpOVTFEUVRGTlJFRnVTVWhvZEdKSE5YcFFVMlJ2WkVoU2QwOXBPSFprTTJRelRHNWpla3h0T1hsYWVUaDVUVVJCZDB3elRqSmFlV01yVUVkT2NHTnRUbk5hVTBKcVpVUXdiazFxVlhsS2VVSnFaVlF3YmsxcVNUSktlVUo1VUZOamVFMUVRbmRsUTJObldtMXNjMkpFTUc1SmVtTXhUbTFPYWsxcFkzWlFhbmQyWXpOYWJsQm5QVDBpSUM4K1BHWmxRbXhsYm1RZ2JXOWtaVDBpYjNabGNteGhlU0lnYVc0OUluQXdJaUJwYmpJOUluQXhJaUF2UGp4bVpVSnNaVzVrSUcxdlpHVTlJbVY0WTJ4MWMybHZiaUlnYVc0eVBTSndNaUlnTHo0OFptVkNiR1Z1WkNCdGIyUmxQU0p2ZG1WeWJHRjVJaUJwYmpJOUluQXpJaUJ5WlhOMWJIUTlJbUpzWlc1a1QzVjBJaUF2UGp4bVpVZGhkWE56YVdGdVFteDFjaUJwYmowaVlteGxibVJQZFhRaUlITjBaRVJsZG1saGRHbHZiajBpTkRJaUlDOCtQQzltYVd4MFpYSStJRHhqYkdsd1VHRjBhQ0JwWkQwaVkyOXlibVZ5Y3lJK1BISmxZM1FnZDJsa2RHZzlJakk1TUNJZ2FHVnBaMmgwUFNJMU1EQWlJSEo0UFNJME1pSWdjbms5SWpReUlpQXZQand2WTJ4cGNGQmhkR2crUEhCaGRHZ2dhV1E5SW5SbGVIUXRjR0YwYUMxaElpQmtQU0pOTkRBZ01USWdTREkxTUNCQk1qZ2dNamdnTUNBd0lERWdNamM0SURRd0lGWTBOakFnUVRJNElESTRJREFnTUNBeElESTFNQ0EwT0RnZ1NEUXdJRUV5T0NBeU9DQXdJREFnTVNBeE1pQTBOakFnVmpRd0lFRXlPQ0F5T0NBd0lEQWdNU0EwTUNBeE1pQjZJaUF2UGp4d1lYUm9JR2xrUFNKdGFXNXBiV0Z3SWlCa1BTSk5Nak0wSURRME5FTXlNelFnTkRVM0xqazBPU0F5TkRJdU1qRWdORFl6SURJMU15QTBOak1pSUM4K1BHWnBiSFJsY2lCcFpEMGlkRzl3TFhKbFoybHZiaTFpYkhWeUlqNDhabVZIWVhWemMybGhia0pzZFhJZ2FXNDlJbE52ZFhKalpVZHlZWEJvYVdNaUlITjBaRVJsZG1saGRHbHZiajBpTWpRaUlDOCtQQzltYVd4MFpYSStQR3hwYm1WaGNrZHlZV1JwWlc1MElHbGtQU0puY21Ga0xYVndJaUI0TVQwaU1TSWdlREk5SWpBaUlIa3hQU0l4SWlCNU1qMGlNQ0krUEhOMGIzQWdiMlptYzJWMFBTSXdMakFpSUhOMGIzQXRZMjlzYjNJOUluZG9hWFJsSWlCemRHOXdMVzl3WVdOcGRIazlJakVpSUM4K1BITjBiM0FnYjJabWMyVjBQU0l1T1NJZ2MzUnZjQzFqYjJ4dmNqMGlkMmhwZEdVaUlITjBiM0F0YjNCaFkybDBlVDBpTUNJZ0x6NDhMMnhwYm1WaGNrZHlZV1JwWlc1MFBqeHNhVzVsWVhKSGNtRmthV1Z1ZENCcFpEMGlaM0poWkMxa2IzZHVJaUI0TVQwaU1DSWdlREk5SWpFaUlIa3hQU0l3SWlCNU1qMGlNU0krUEhOMGIzQWdiMlptYzJWMFBTSXdMakFpSUhOMGIzQXRZMjlzYjNJOUluZG9hWFJsSWlCemRHOXdMVzl3WVdOcGRIazlJakVpSUM4K1BITjBiM0FnYjJabWMyVjBQU0l3TGpraUlITjBiM0F0WTI5c2IzSTlJbmRvYVhSbElpQnpkRzl3TFc5d1lXTnBkSGs5SWpBaUlDOCtQQzlzYVc1bFlYSkhjbUZrYVdWdWRENDhiV0Z6YXlCcFpEMGlabUZrWlMxMWNDSWdiV0Z6YTBOdmJuUmxiblJWYm1sMGN6MGliMkpxWldOMFFtOTFibVJwYm1kQ2IzZ2lQanh5WldOMElIZHBaSFJvUFNJeElpQm9aV2xuYUhROUlqRWlJR1pwYkd3OUluVnliQ2dqWjNKaFpDMTFjQ2tpSUM4K1BDOXRZWE5yUGp4dFlYTnJJR2xrUFNKbVlXUmxMV1J2ZDI0aUlHMWhjMnREYjI1MFpXNTBWVzVwZEhNOUltOWlhbVZqZEVKdmRXNWthVzVuUW05NElqNDhjbVZqZENCM2FXUjBhRDBpTVNJZ2FHVnBaMmgwUFNJeElpQm1hV3hzUFNKMWNtd29JMmR5WVdRdFpHOTNiaWtpSUM4K1BDOXRZWE5yUGp4dFlYTnJJR2xrUFNKdWIyNWxJaUJ0WVhOclEyOXVkR1Z1ZEZWdWFYUnpQU0p2WW1wbFkzUkNiM1Z1WkdsdVowSnZlQ0krUEhKbFkzUWdkMmxrZEdnOUlqRWlJR2hsYVdkb2REMGlNU0lnWm1sc2JEMGlkMmhwZEdVaUlDOCtQQzl0WVhOclBqeHNhVzVsWVhKSGNtRmthV1Z1ZENCcFpEMGlaM0poWkMxemVXMWliMndpUGp4emRHOXdJRzltWm5ObGREMGlNQzQzSWlCemRHOXdMV052Ykc5eVBTSjNhR2wwWlNJZ2MzUnZjQzF2Y0dGamFYUjVQU0l4SWlBdlBqeHpkRzl3SUc5bVpuTmxkRDBpTGprMUlpQnpkRzl3TFdOdmJHOXlQU0ozYUdsMFpTSWdjM1J2Y0MxdmNHRmphWFI1UFNJd0lpQXZQand2YkdsdVpXRnlSM0poWkdsbGJuUStQRzFoYzJzZ2FXUTlJbVpoWkdVdGMzbHRZbTlzSWlCdFlYTnJRMjl1ZEdWdWRGVnVhWFJ6UFNKMWMyVnlVM0JoWTJWUGJsVnpaU0krUEhKbFkzUWdkMmxrZEdnOUlqSTVNSEI0SWlCb1pXbG5hSFE5SWpJd01IQjRJaUJtYVd4c1BTSjFjbXdvSTJkeVlXUXRjM2x0WW05c0tTSWdMejQ4TDIxaGMycytQQzlrWldaelBqeG5JR05zYVhBdGNHRjBhRDBpZFhKc0tDTmpiM0p1WlhKektTSStQSEpsWTNRZ1ptbHNiRDBpWkdGak1UZG1JaUI0UFNJd2NIZ2lJSGs5SWpCd2VDSWdkMmxrZEdnOUlqSTVNSEI0SWlCb1pXbG5hSFE5SWpVd01IQjRJaUF2UGp4eVpXTjBJSE4wZVd4bFBTSm1hV3gwWlhJNklIVnliQ2dqWmpFcElpQjRQU0l3Y0hnaUlIazlJakJ3ZUNJZ2QybGtkR2c5SWpJNU1IQjRJaUJvWldsbmFIUTlJalV3TUhCNElpQXZQaUE4WnlCemRIbHNaVDBpWm1sc2RHVnlPblZ5YkNnamRHOXdMWEpsWjJsdmJpMWliSFZ5S1RzZ2RISmhibk5tYjNKdE9uTmpZV3hsS0RFdU5TazdJSFJ5WVc1elptOXliUzF2Y21sbmFXNDZZMlZ1ZEdWeUlIUnZjRHNpUGp4eVpXTjBJR1pwYkd3OUltNXZibVVpSUhnOUlqQndlQ0lnZVQwaU1IQjRJaUIzYVdSMGFEMGlNamt3Y0hnaUlHaGxhV2RvZEQwaU5UQXdjSGdpSUM4K1BHVnNiR2x3YzJVZ1kzZzlJalV3SlNJZ1kzazlJakJ3ZUNJZ2NuZzlJakU0TUhCNElpQnllVDBpTVRJd2NIZ2lJR1pwYkd3OUlpTXdNREFpSUc5d1lXTnBkSGs5SWpBdU9EVWlJQzgrUEM5blBqeHlaV04wSUhnOUlqQWlJSGs5SWpBaUlIZHBaSFJvUFNJeU9UQWlJR2hsYVdkb2REMGlOVEF3SWlCeWVEMGlORElpSUhKNVBTSTBNaUlnWm1sc2JEMGljbWRpWVNnd0xEQXNNQ3d3S1NJZ2MzUnliMnRsUFNKeVoySmhLREkxTlN3eU5UVXNNalUxTERBdU1pa2lJQzgrUEM5blBqeDBaWGgwSUhSbGVIUXRjbVZ1WkdWeWFXNW5QU0p2Y0hScGJXbDZaVk53WldWa0lqNDhkR1Y0ZEZCaGRHZ2djM1JoY25SUFptWnpaWFE5SWkweE1EQWxJaUJtYVd4c1BTSjNhR2wwWlNJZ1ptOXVkQzFtWVcxcGJIazlJaWREYjNWeWFXVnlJRTVsZHljc0lHMXZibTl6Y0dGalpTSWdabTl1ZEMxemFYcGxQU0l4TUhCNElpQjRiR2x1YXpwb2NtVm1QU0lqZEdWNGRDMXdZWFJvTFdFaVBqQjRZekF5WVdGaE16bGlNakl6Wm1VNFpEQmhNR1UxWXpSbU1qZGxZV1E1TURnell6YzFObU5qTWlEaWdLSWdWMFZVU0NBOFlXNXBiV0YwWlNCaFpHUnBkR2wyWlQwaWMzVnRJaUJoZEhSeWFXSjFkR1ZPWVcxbFBTSnpkR0Z5ZEU5bVpuTmxkQ0lnWm5KdmJUMGlNQ1VpSUhSdlBTSXhNREFsSWlCaVpXZHBiajBpTUhNaUlHUjFjajBpTXpCeklpQnlaWEJsWVhSRGIzVnVkRDBpYVc1a1pXWnBibWwwWlNJZ0x6NDhMM1JsZUhSUVlYUm9QaUE4ZEdWNGRGQmhkR2dnYzNSaGNuUlBabVp6WlhROUlqQWxJaUJtYVd4c1BTSjNhR2wwWlNJZ1ptOXVkQzFtWVcxcGJIazlJaWREYjNWeWFXVnlJRTVsZHljc0lHMXZibTl6Y0dGalpTSWdabTl1ZEMxemFYcGxQU0l4TUhCNElpQjRiR2x1YXpwb2NtVm1QU0lqZEdWNGRDMXdZWFJvTFdFaVBqQjRZekF5WVdGaE16bGlNakl6Wm1VNFpEQmhNR1UxWXpSbU1qZGxZV1E1TURnell6YzFObU5qTWlEaWdLSWdWMFZVU0NBOFlXNXBiV0YwWlNCaFpHUnBkR2wyWlQwaWMzVnRJaUJoZEhSeWFXSjFkR1ZPWVcxbFBTSnpkR0Z5ZEU5bVpuTmxkQ0lnWm5KdmJUMGlNQ1VpSUhSdlBTSXhNREFsSWlCaVpXZHBiajBpTUhNaUlHUjFjajBpTXpCeklpQnlaWEJsWVhSRGIzVnVkRDBpYVc1a1pXWnBibWwwWlNJZ0x6NGdQQzkwWlhoMFVHRjBhRDQ4ZEdWNGRGQmhkR2dnYzNSaGNuUlBabVp6WlhROUlqVXdKU0lnWm1sc2JEMGlkMmhwZEdVaUlHWnZiblF0Wm1GdGFXeDVQU0luUTI5MWNtbGxjaUJPWlhjbkxDQnRiMjV2YzNCaFkyVWlJR1p2Ym5RdGMybDZaVDBpTVRCd2VDSWdlR3hwYm1zNmFISmxaajBpSTNSbGVIUXRjR0YwYUMxaElqNHdlR1JoWXpFM1pqazFPR1F5WldVMU1qTmhNakl3TmpJd05qazVORFU1TjJNeE0yUTRNekZsWXpjZzRvQ2lJRlZUUkZRZ1BHRnVhVzFoZEdVZ1lXUmthWFJwZG1VOUluTjFiU0lnWVhSMGNtbGlkWFJsVG1GdFpUMGljM1JoY25SUFptWnpaWFFpSUdaeWIyMDlJakFsSWlCMGJ6MGlNVEF3SlNJZ1ltVm5hVzQ5SWpCeklpQmtkWEk5SWpNd2N5SWdjbVZ3WldGMFEyOTFiblE5SW1sdVpHVm1hVzVwZEdVaUlDOCtQQzkwWlhoMFVHRjBhRDQ4ZEdWNGRGQmhkR2dnYzNSaGNuUlBabVp6WlhROUlpMDFNQ1VpSUdacGJHdzlJbmRvYVhSbElpQm1iMjUwTFdaaGJXbHNlVDBpSjBOdmRYSnBaWElnVG1WM0p5d2diVzl1YjNOd1lXTmxJaUJtYjI1MExYTnBlbVU5SWpFd2NIZ2lJSGhzYVc1ck9taHlaV1k5SWlOMFpYaDBMWEJoZEdndFlTSStNSGhrWVdNeE4yWTVOVGhrTW1WbE5USXpZVEl5TURZeU1EWTVPVFExT1Rkak1UTmtPRE14WldNM0lPS0FvaUJWVTBSVUlEeGhibWx0WVhSbElHRmtaR2wwYVhabFBTSnpkVzBpSUdGMGRISnBZblYwWlU1aGJXVTlJbk4wWVhKMFQyWm1jMlYwSWlCbWNtOXRQU0l3SlNJZ2RHODlJakV3TUNVaUlHSmxaMmx1UFNJd2N5SWdaSFZ5UFNJek1ITWlJSEpsY0dWaGRFTnZkVzUwUFNKcGJtUmxabWx1YVhSbElpQXZQand2ZEdWNGRGQmhkR2crUEM5MFpYaDBQanhuSUcxaGMyczlJblZ5YkNnalptRmtaUzF6ZVcxaWIyd3BJajQ4Y21WamRDQm1hV3hzUFNKdWIyNWxJaUI0UFNJd2NIZ2lJSGs5SWpCd2VDSWdkMmxrZEdnOUlqSTVNSEI0SWlCb1pXbG5hSFE5SWpJd01IQjRJaUF2UGlBOGRHVjRkQ0I1UFNJM01IQjRJaUI0UFNJek1uQjRJaUJtYVd4c1BTSjNhR2wwWlNJZ1ptOXVkQzFtWVcxcGJIazlJaWREYjNWeWFXVnlJRTVsZHljc0lHMXZibTl6Y0dGalpTSWdabTl1ZEMxM1pXbG5hSFE5SWpJd01DSWdabTl1ZEMxemFYcGxQU0l6Tm5CNElqNVZVMFJVTDFkRlZFZzhMM1JsZUhRK1BIUmxlSFFnZVQwaU1URTFjSGdpSUhnOUlqTXljSGdpSUdacGJHdzlJbmRvYVhSbElpQm1iMjUwTFdaaGJXbHNlVDBpSjBOdmRYSnBaWElnVG1WM0p5d2diVzl1YjNOd1lXTmxJaUJtYjI1MExYZGxhV2RvZEQwaU1qQXdJaUJtYjI1MExYTnBlbVU5SWpNMmNIZ2lQakF1TURVbFBDOTBaWGgwUGp3dlp6NDhjbVZqZENCNFBTSXhOaUlnZVQwaU1UWWlJSGRwWkhSb1BTSXlOVGdpSUdobGFXZG9kRDBpTkRZNElpQnllRDBpTWpZaUlISjVQU0l5TmlJZ1ptbHNiRDBpY21kaVlTZ3dMREFzTUN3d0tTSWdjM1J5YjJ0bFBTSnlaMkpoS0RJMU5Td3lOVFVzTWpVMUxEQXVNaWtpSUM4K1BHY2diV0Z6YXowaWRYSnNLQ051YjI1bEtTSWdjM1I1YkdVOUluUnlZVzV6Wm05eWJUcDBjbUZ1YzJ4aGRHVW9Oekp3ZUN3eE9EbHdlQ2tpUGp4eVpXTjBJSGc5SWkweE5uQjRJaUI1UFNJdE1UWndlQ0lnZDJsa2RHZzlJakU0TUhCNElpQm9aV2xuYUhROUlqRTRNSEI0SWlCbWFXeHNQU0p1YjI1bElpQXZQanh3WVhSb0lHUTlJazB4SURGRE1TQTVOeUEwT1NBeE5EVWdNVFExSURFME5TSWdjM1J5YjJ0bFBTSnlaMkpoS0RBc01Dd3dMREF1TXlraUlITjBjbTlyWlMxM2FXUjBhRDBpTXpKd2VDSWdabWxzYkQwaWJtOXVaU0lnYzNSeWIydGxMV3hwYm1WallYQTlJbkp2ZFc1a0lpQXZQand2Wno0OFp5QnRZWE5yUFNKMWNtd29JMjV2Ym1VcElpQnpkSGxzWlQwaWRISmhibk5tYjNKdE9uUnlZVzV6YkdGMFpTZzNNbkI0TERFNE9YQjRLU0krUEhKbFkzUWdlRDBpTFRFMmNIZ2lJSGs5SWkweE5uQjRJaUIzYVdSMGFEMGlNVGd3Y0hnaUlHaGxhV2RvZEQwaU1UZ3djSGdpSUdacGJHdzlJbTV2Ym1VaUlDOCtQSEJoZEdnZ1pEMGlUVEVnTVVNeElEazNJRFE1SURFME5TQXhORFVnTVRRMUlpQnpkSEp2YTJVOUluSm5ZbUVvTWpVMUxESTFOU3d5TlRVc01Ta2lJR1pwYkd3OUltNXZibVVpSUhOMGNtOXJaUzFzYVc1bFkyRndQU0p5YjNWdVpDSWdMejQ4TDJjK1BHTnBjbU5zWlNCamVEMGlOek53ZUNJZ1kzazlJakU1TUhCNElpQnlQU0kwY0hnaUlHWnBiR3c5SW5kb2FYUmxJaUF2UGp4amFYSmpiR1VnWTNnOUlqSXhOM0I0SWlCamVUMGlNek0wY0hnaUlISTlJalJ3ZUNJZ1ptbHNiRDBpZDJocGRHVWlJQzgrSUR4bklITjBlV3hsUFNKMGNtRnVjMlp2Y20wNmRISmhibk5zWVhSbEtESTVjSGdzSURNNE5IQjRLU0krUEhKbFkzUWdkMmxrZEdnOUlqazRjSGdpSUdobGFXZG9kRDBpTWpad2VDSWdjbmc5SWpod2VDSWdjbms5SWpod2VDSWdabWxzYkQwaWNtZGlZU2d3TERBc01Dd3dMallwSWlBdlBqeDBaWGgwSUhnOUlqRXljSGdpSUhrOUlqRTNjSGdpSUdadmJuUXRabUZ0YVd4NVBTSW5RMjkxY21sbGNpQk9aWGNuTENCdGIyNXZjM0JoWTJVaUlHWnZiblF0YzJsNlpUMGlNVEp3ZUNJZ1ptbHNiRDBpZDJocGRHVWlQangwYzNCaGJpQm1hV3hzUFNKeVoySmhLREkxTlN3eU5UVXNNalUxTERBdU5pa2lQa2xFT2lBOEwzUnpjR0Z1UGpFNU9UUXdOand2ZEdWNGRENDhMMmMrSUR4bklITjBlV3hsUFNKMGNtRnVjMlp2Y20wNmRISmhibk5zWVhSbEtESTVjSGdzSURReE5IQjRLU0krUEhKbFkzUWdkMmxrZEdnOUlqRTBOM0I0SWlCb1pXbG5hSFE5SWpJMmNIZ2lJSEo0UFNJNGNIZ2lJSEo1UFNJNGNIZ2lJR1pwYkd3OUluSm5ZbUVvTUN3d0xEQXNNQzQyS1NJZ0x6NDhkR1Y0ZENCNFBTSXhNbkI0SWlCNVBTSXhOM0I0SWlCbWIyNTBMV1poYldsc2VUMGlKME52ZFhKcFpYSWdUbVYzSnl3Z2JXOXViM053WVdObElpQm1iMjUwTFhOcGVtVTlJakV5Y0hnaUlHWnBiR3c5SW5kb2FYUmxJajQ4ZEhOd1lXNGdabWxzYkQwaWNtZGlZU2d5TlRVc01qVTFMREkxTlN3d0xqWXBJajVOYVc0Z1ZHbGphem9nUEM5MGMzQmhiajR0TWpBd01EY3dQQzkwWlhoMFBqd3ZaejRnUEdjZ2MzUjViR1U5SW5SeVlXNXpabTl5YlRwMGNtRnVjMnhoZEdVb01qbHdlQ3dnTkRRMGNIZ3BJajQ4Y21WamRDQjNhV1IwYUQwaU1UUTNjSGdpSUdobGFXZG9kRDBpTWpad2VDSWdjbmc5SWpod2VDSWdjbms5SWpod2VDSWdabWxzYkQwaWNtZGlZU2d3TERBc01Dd3dMallwSWlBdlBqeDBaWGgwSUhnOUlqRXljSGdpSUhrOUlqRTNjSGdpSUdadmJuUXRabUZ0YVd4NVBTSW5RMjkxY21sbGNpQk9aWGNuTENCdGIyNXZjM0JoWTJVaUlHWnZiblF0YzJsNlpUMGlNVEp3ZUNJZ1ptbHNiRDBpZDJocGRHVWlQangwYzNCaGJpQm1hV3hzUFNKeVoySmhLREkxTlN3eU5UVXNNalUxTERBdU5pa2lQazFoZUNCVWFXTnJPaUE4TDNSemNHRnVQaTB4T1RNNU16QThMM1JsZUhRK1BDOW5QanhuSUhOMGVXeGxQU0owY21GdWMyWnZjbTA2ZEhKaGJuTnNZWFJsS0RJeU5uQjRMQ0EwTXpOd2VDa2lQanh5WldOMElIZHBaSFJvUFNJek5uQjRJaUJvWldsbmFIUTlJak0yY0hnaUlISjRQU0k0Y0hnaUlISjVQU0k0Y0hnaUlHWnBiR3c5SW01dmJtVWlJSE4wY205clpUMGljbWRpWVNneU5UVXNNalUxTERJMU5Td3dMaklwSWlBdlBqeHdZWFJvSUhOMGNtOXJaUzFzYVc1bFkyRndQU0p5YjNWdVpDSWdaRDBpVFRnZ09VTTRMakF3TURBMElESXlMamswT1RRZ01UWXVNakE1T1NBeU9DQXlOeUF5T0NJZ1ptbHNiRDBpYm05dVpTSWdjM1J5YjJ0bFBTSjNhR2wwWlNJZ0x6NDhZMmx5WTJ4bElITjBlV3hsUFNKMGNtRnVjMlp2Y20wNmRISmhibk5zWVhSbE0yUW9PSEI0TENBM2NIZ3NJREJ3ZUNraUlHTjRQU0l3Y0hnaUlHTjVQU0l3Y0hnaUlISTlJalJ3ZUNJZ1ptbHNiRDBpZDJocGRHVWlMejQ4TDJjK1BDOXpkbWMrIn0='),
    ];

    result.forEach((item) => {
      expect(typeof item === 'string').toBeTruthy();
    });
    expect(result).toMatchSnapshot();
  });

  it('should throw bad media type error in case if not application/json media type is passed', () => {
    expect(() => {
      // If omitted default media type for Data URLs - text/plain
      // eslint-disable-next-line max-len
      onChainReader('data:;base64,ewogICAgIm5hbWUiOiAiVGhvcidzIGhhbW1lciIsCiAgICAiZGVzY3JpcHRpb24iOiAiTWrDtmxuaXIsIHRoZSBsZWdlbmRhcnkgaGFtbWVyIG9mIHRoZSBOb3JzZSBnb2Qgb2YgdGh1bmRlci4iLAogICAgImltYWdlIjogImh0dHBzOi8vc3RhdGljLndpa2lhLm5vY29va2llLm5ldC9tYXJ2ZWxjaW5lbWF0aWN1bml2ZXJzZS9pbWFnZXMvMi8yNS9Nam9sbmlyLnBuZy9yZXZpc2lvbi9sYXRlc3Qvc2NhbGUtdG8td2lkdGgtZG93bi8zNTA/Y2I9MjAxNDAxMjkwMDEyNDQiLAogICAgInN0cmVuZ3RoIjogMjAKfQ==');
    }).toThrowErrorMatchingSnapshot();

    expect(() => {
      // eslint-disable-next-line max-len
      onChainReader('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAHElEQVQI12P4//8/w38GIAXDIBKE0DHxgljNBAAO9TXL0Y4OHwAAAABJRU5ErkJggg==');
    }).toThrowErrorMatchingSnapshot();
  });

  it('should throw bad encoding error in case if not base64 encoding is passed', () => {
    expect(() => {
      onChainReader(`data:text/html;charset=utf-8,${
        encodeURIComponent(
          '<!DOCTYPE html>' +
          '<html lang="en">' +
          '<head><title>Embedded Window</title></head>' +
          '<body><h1>42</h1></body>' +
          '</html>',
        )}`);
    }).toThrowErrorMatchingSnapshot();
  });
});

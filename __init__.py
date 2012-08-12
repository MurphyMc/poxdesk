# Copyright 2012 James McCauley
#
# This file is part of POX.
#
# POX is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# POX is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with POX.  If not, see <http://www.gnu.org/licenses/>.

"""
This allows you to easily run POXDesk.
"""

from pox.core import core
import os.path

log = core.getLogger()

def _start_poxdesk (path):
  httpd = core.WebServer
  httpd.add_static_dir('poxdesk', path, relative=True)
  httpd.add_static_dir('qx', 'qx', relative=True)


def launch ():
  base = os.path.dirname(__file__)

  have_qx = os.path.exists(os.path.join(base,"qx"))
  have_build = os.path.exists(os.path.join(base,"poxdesk","build"))


  if not have_qx and not have_build:
    log.error("You need to have Qooxdoo in a directory named 'qx', or "
              + "you need a built version of POXDesk")
    return

  path = "poxdesk"
  if have_build:
    path = os.path.join(path, 'build')
    log.debug("Using built version of POXDesk")
  else:
    log.debug("Using source version of POXDesk")

  core.call_when_ready(_start_poxdesk, ["WebServer",
                                        "MessengerNexus_of_service"],
                       args=(path,))

